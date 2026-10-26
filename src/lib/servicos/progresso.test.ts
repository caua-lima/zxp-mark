/**
 * Integração com o banco real — só roda com ZXP_TESTE_DB=1 (ver teste-db.ts).
 */
import { test, after } from "node:test";
import assert from "node:assert/strict";
import {
  abrirBanco,
  criarUsuarioDeTeste,
  limparUsuariosDeTeste,
  TESTE_DB_LIGADO,
} from "./teste-db.ts";
import {
  listarPercepcoes,
  marcarVistas,
  prepararProgresso,
  resolverReferencia,
  salvarPercepcao,
} from "./progresso.ts";
import { criarAcompanhamento, editarAcompanhamento } from "./acompanhamentos.ts";
import { DIA_MS, HORA_MS, instanteLocal } from "../datas.ts";
import { escolherCelebracao, etapasDoAcompanhamento } from "../progressao.ts";

const SP = "America/Sao_Paulo";
const opcoes = { skip: !TESTE_DB_LIGADO && "defina ZXP_TESTE_DB=1 para rodar contra o banco" };
const db = TESTE_DB_LIGADO ? abrirBanco() : (null as never);

const t0 = instanteLocal("2026-10-26T10:00", SP)!.getTime();
const apos = (dias: number) => t0 + dias * DIA_MS;

after(async () => {
  if (!TESTE_DB_LIGADO) return;
  await limparUsuariosDeTeste(db);
  await db.$disconnect();
});

async function novoAcompanhamento(uid: string, inicio: string, agora: number) {
  const c = await criarAcompanhamento(db, uid, { titulo: "Teste", categoria: "rotina", inicio }, SP, agora);
  assert.ok(c.ok, c.ok ? "" : c.erro);
  return c.valor;
}

test("o primeiro olhar semeia em silêncio: abrir um item antigo não dispara enxurrada", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "semeia");
  const a = await novoAcompanhamento(u.id, "2026-08-01", t0); // ~86 dias atrás
  const ref = (await resolverReferencia(db, u.id, "acompanhamento", a.id, t0))!;

  const p = await prepararProgresso(db, u.id, ref);
  assert.ok(p.atingidas.length >= 5, "várias etapas já passaram");
  assert.deepEqual(p.pendentes, []);
  assert.equal(escolherCelebracao(ref.etapas, p.atingidas, p.vistas), null);
});

test("uma etapa nova é comemorada uma vez só, mesmo com recarga e clique repetido", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "dedup");
  const a = await novoAcompanhamento(u.id, "2026-10-20", t0); // 6 dias: só 3d atingida

  const ref0 = (await resolverReferencia(db, u.id, "acompanhamento", a.id, t0))!;
  await prepararProgresso(db, u.id, ref0); // primeiro olhar

  // dois dias depois: a etapa de 1 semana é atingida
  const t1 = apos(2);
  const ref1 = (await resolverReferencia(db, u.id, "acompanhamento", a.id, t1))!;
  const antes = await prepararProgresso(db, u.id, ref1);
  assert.deepEqual(antes.pendentes, ["7d"]);
  // recarregar a página não muda nada, enquanto ninguém marcou como vista
  assert.deepEqual((await prepararProgresso(db, u.id, ref1)).pendentes, ["7d"]);

  const m1 = await marcarVistas(db, u.id, "acompanhamento", a.id, ["7d"], t1);
  assert.ok(m1.ok && m1.valor.marcadas === 1);
  const m2 = await marcarVistas(db, u.id, "acompanhamento", a.id, ["7d"], t1);
  assert.ok(m2.ok && m2.valor.marcadas === 0, "o segundo clique não cria nada");

  assert.deepEqual((await prepararProgresso(db, u.id, ref1)).pendentes, []);
  assert.equal(await db.conquistaVista.count({ where: { userId: u.id, refId: a.id, chave: "7d" } }), 1);
});

test("cliques simultâneos (duas abas, toque duplo) criam uma linha só", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "corrida");
  const a = await novoAcompanhamento(u.id, "2026-10-10", t0);
  const ref = (await resolverReferencia(db, u.id, "acompanhamento", a.id, t0))!;
  await prepararProgresso(db, u.id, ref);

  const t1 = apos(20); // 30 dias desde o início → 30d atingida
  await Promise.all(
    Array.from({ length: 6 }, () => marcarVistas(db, u.id, "acompanhamento", a.id, ["30d"], t1))
  );
  assert.equal(await db.conquistaVista.count({ where: { userId: u.id, refId: a.id, chave: "30d" } }), 1);
});

test("corrigir a data de início NÃO gera recompensa artificial", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "corrige");
  const a = await novoAcompanhamento(u.id, "2026-10-20", t0); // 6 dias
  const ref0 = (await resolverReferencia(db, u.id, "acompanhamento", a.id, t0))!;
  await prepararProgresso(db, u.id, ref0);

  // a pessoa percebe que errou a data: começou, na verdade, há ~100 dias
  const e = await editarAcompanhamento(db, u.id, a.id, { inicio: "2026-07-15" }, SP, t0);
  assert.ok(e.ok);

  const ref1 = (await resolverReferencia(db, u.id, "acompanhamento", a.id, t0))!;
  assert.ok(ref1.etapas.length > 0 && ref1.valor > 90 * DIA_MS);
  const p = await prepararProgresso(db, u.id, ref1);
  assert.ok(p.atingidas.includes("90d"), "a trilha avançou de verdade");
  assert.deepEqual(p.pendentes, [], "mas nada vira celebração retroativa");
  assert.equal(escolherCelebracao(ref1.etapas, p.atingidas, p.vistas), null);
});

test("recomeçar um ciclo (recaída/correção em marco) recomeça a trilha em silêncio", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "marco");
  const ciclo1 = new Date(t0 - 3 * DIA_MS);
  const m = await db.marco.create({
    data: { userId: u.id, titulo: "Teste", preset: "cigarro", inicio: ciclo1, cicloInicio: ciclo1 },
  });

  const r1 = (await resolverReferencia(db, u.id, "marco", m.id, t0))!;
  assert.deepEqual((await prepararProgresso(db, u.id, r1)).pendentes, []);

  // recaída: o ciclo recomeça; duas horas depois, "1h" e "2h" já passaram
  const ciclo2 = new Date(t0 - 2 * HORA_MS - 5 * 60_000);
  await db.marco.update({ where: { id: m.id }, data: { cicloInicio: ciclo2 } });
  const r2 = (await resolverReferencia(db, u.id, "marco", m.id, t0))!;
  assert.notEqual(r2.ciclo.getTime(), r1.ciclo.getTime());
  const p2 = await prepararProgresso(db, u.id, r2);
  assert.ok(p2.atingidas.includes("1h"));
  assert.deepEqual(p2.pendentes, [], "primeiro olhar do ciclo novo é silencioso");

  // ...mas o que vem depois, comemora normalmente
  const rDepois = (await resolverReferencia(db, u.id, "marco", m.id, t0 + 2 * HORA_MS))!;
  assert.ok((await prepararProgresso(db, u.id, rDepois)).pendentes.includes("3h"));
});

test("não dá para marcar como vista uma etapa que ainda não foi atingida", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "forja");
  const a = await novoAcompanhamento(u.id, "2026-10-24", t0);
  const r = await marcarVistas(db, u.id, "acompanhamento", a.id, ["365d", "7d", "lixo", "_base"], t0);
  assert.ok(r.ok && r.valor.marcadas === 0);
  assert.equal(await db.conquistaVista.count({ where: { userId: u.id, refId: a.id } }), 0);
});

test("autorização: outra pessoa não marca vistas nem anota percepção no meu item", opcoes, async () => {
  const dona = await criarUsuarioDeTeste(db, "dona2");
  const intrusa = await criarUsuarioDeTeste(db, "intrusa2");
  const a = await novoAcompanhamento(dona.id, "2026-09-01", t0);

  assert.equal(await resolverReferencia(db, intrusa.id, "acompanhamento", a.id, t0), null);
  const v = await marcarVistas(db, intrusa.id, "acompanhamento", a.id, ["7d"], t0);
  assert.equal(!v.ok && v.status, 404);
  const p = await salvarPercepcao(db, intrusa.id, { tipo: "acompanhamento", refId: a.id, chave: "7d", nota: "oi" }, t0);
  assert.equal(!p.ok && p.status, 404);
  // a trilha de sono é da conta: ninguém abre a de outro passando o id dele
  assert.equal(await resolverReferencia(db, intrusa.id, "sono", dona.id, t0), null);

  assert.equal(await db.conquistaVista.count({ where: { userId: intrusa.id } }), 0);
  assert.equal(await db.percepcao.count({ where: { userId: intrusa.id } }), 0);
});

test("percepção: salva, edita, e em branco apaga — sem virar obrigação", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "percep");
  const a = await novoAcompanhamento(u.id, "2026-10-10", t0); // 16 dias
  const base = { tipo: "acompanhamento" as const, refId: a.id, chave: "7d" };

  const s1 = await salvarPercepcao(db, u.id, { ...base, humor: 4, nota: "  mais disposição de manhã " }, t0);
  assert.ok(s1.ok);
  assert.deepEqual(s1.ok && s1.valor, { humor: 4, nota: "mais disposição de manhã" });

  await salvarPercepcao(db, u.id, { ...base, humor: 5, nota: "melhor ainda" }, t0);
  const ref = (await resolverReferencia(db, u.id, "acompanhamento", a.id, t0))!;
  assert.deepEqual((await listarPercepcoes(db, u.id, ref))["7d"], { humor: 5, nota: "melhor ainda" });
  assert.equal(await db.percepcao.count({ where: { userId: u.id } }), 1, "editar não duplica");

  // só o humor, sem texto
  const soHumor = await salvarPercepcao(db, u.id, { ...base, humor: 3, nota: "" }, t0);
  assert.deepEqual(soHumor.ok && soHumor.valor, { humor: 3, nota: null });

  // deixar tudo em branco é uma resposta válida: apaga
  const vazio = await salvarPercepcao(db, u.id, { ...base, humor: null, nota: "  " }, t0);
  assert.ok(vazio.ok && vazio.valor === null);
  assert.equal(await db.percepcao.count({ where: { userId: u.id } }), 0);
});

test("percepção: recusa etapa não alcançada, humor fora de 1-5 e nota longa", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "percep2");
  const a = await novoAcompanhamento(u.id, "2026-10-24", t0); // 2 dias
  const base = { tipo: "acompanhamento" as const, refId: a.id };

  const futura = await salvarPercepcao(db, u.id, { ...base, chave: "30d", nota: "x" }, t0);
  assert.equal(!futura.ok && futura.status, 400);
  const humor = await salvarPercepcao(db, u.id, { ...base, chave: "inicio", humor: 9 }, t0);
  assert.equal(!humor.ok && humor.status, 400);
  const longa = await salvarPercepcao(db, u.id, { ...base, chave: "inicio", nota: "x".repeat(301) }, t0);
  assert.equal(!longa.ok && longa.status, 400);
  // a abertura da trilha aceita anotação desde o primeiro dia
  const ok = await salvarPercepcao(db, u.id, { ...base, chave: "inicio", nota: "começando" }, t0);
  assert.ok(ok.ok);
  assert.equal(await db.percepcao.count({ where: { userId: u.id } }), 1);
});

test("sono: a trilha conta noites registradas, e uma pausa não apaga o que já existe", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "sono");
  const noite = (dia: string) => ({
    userId: u.id,
    dormiuEm: instanteLocal(`${dia}T23:00`, SP)!,
    acordouEm: instanteLocal(`${dia}T23:00`, SP)!, // ajustado abaixo
    qualidade: 3,
  });
  const criar = async (diaAcordou: string, diaDormiu: string) =>
    db.sono.create({
      data: {
        ...noite(diaDormiu),
        acordouEm: instanteLocal(`${diaAcordou}T07:00`, SP)!,
      },
    });

  const r0 = (await resolverReferencia(db, u.id, "sono", u.id, t0))!;
  assert.equal(r0.valor, 0);
  await prepararProgresso(db, u.id, r0); // primeiro olhar, sem registros

  // 3 noites distintas, mais um cochilo no mesmo dia (não conta de novo)
  const a = await criar("2026-10-01", "2026-09-30");
  await criar("2026-10-02", "2026-10-01");
  await criar("2026-10-03", "2026-10-02");
  await db.sono.create({
    data: { userId: u.id, dormiuEm: instanteLocal("2026-10-03T14:00", SP)!, acordouEm: instanteLocal("2026-10-03T15:00", SP)!, qualidade: 2 },
  });

  const r1 = (await resolverReferencia(db, u.id, "sono", u.id, t0))!;
  assert.equal(r1.valor, 3, "dias distintos, não registros");
  const p1 = await prepararProgresso(db, u.id, r1);
  assert.deepEqual(p1.pendentes.sort(), ["n1", "n3"]);
  await marcarVistas(db, u.id, "sono", u.id, ["n1", "n3"], t0);

  // semanas sem registrar: o valor não cai
  const r2 = (await resolverReferencia(db, u.id, "sono", u.id, t0 + 40 * DIA_MS))!;
  assert.equal(r2.valor, 3);
  assert.deepEqual((await prepararProgresso(db, u.id, r2)).pendentes, []);

  // apagar um registro e refazer não comemora de novo o que já foi visto
  await db.sono.delete({ where: { id: a.id } });
  assert.equal((await resolverReferencia(db, u.id, "sono", u.id, t0))!.valor, 2);
  await criar("2026-10-01", "2026-09-30");
  const r3 = (await resolverReferencia(db, u.id, "sono", u.id, t0))!;
  assert.equal(r3.valor, 3);
  assert.deepEqual((await prepararProgresso(db, u.id, r3)).pendentes, []);
});

test("as etapas de uma trilha nunca somem ao reler (mesma entrada, mesma saída)", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "estavel");
  const a = await novoAcompanhamento(u.id, "2026-10-10", t0);
  const r = (await resolverReferencia(db, u.id, "acompanhamento", a.id, t0))!;
  assert.deepEqual(r.etapas.map((e) => e.chave), etapasDoAcompanhamento().map((e) => e.chave));
});
