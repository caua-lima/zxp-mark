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
  carregarSono,
  criarSono,
  editarSono,
  excluirSono,
  listarSono,
  obterSono,
} from "./sono.ts";
import { HORA_MS, instanteLocal } from "../datas.ts";

const SP = "America/Sao_Paulo";
const opcoes = { skip: !TESTE_DB_LIGADO && "defina ZXP_TESTE_DB=1 para rodar contra o banco" };
const db = TESTE_DB_LIGADO ? abrirBanco() : (null as never);
const agora = instanteLocal("2026-10-26T10:00", SP)!.getTime();

after(async () => {
  if (!TESTE_DB_LIGADO) return;
  await limparUsuariosDeTeste(db);
  await db.$disconnect();
});

const noite = (dormiuEm: string, acordouEm: string, qualidade = 3, nota?: string) => ({
  dormiuEm,
  acordouEm,
  qualidade,
  nota,
});

test("persiste e volta igual: a noite que atravessa a meia-noite, no fuso do usuário", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "sono1");
  const c = await criarSono(db, u.id, noite("2026-10-25T23:30", "2026-10-26T07:00", 4, "acordei 1x"), SP, agora);
  assert.ok(c.ok, c.ok ? "" : c.erro);

  const lido = await obterSono(db, u.id, c.valor.id);
  assert.equal(lido?.dormiuEm.toISOString(), "2026-10-26T02:30:00.000Z");
  assert.equal(lido?.acordouEm.toISOString(), "2026-10-26T10:00:00.000Z");
  assert.equal(lido?.qualidade, 4);
  assert.equal(lido?.nota, "acordei 1x");
  assert.equal((lido!.acordouEm.getTime() - lido!.dormiuEm.getTime()) / HORA_MS, 7.5);
});

test("recusa intervalo invertido, absurdo e futuro — e nada é gravado", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "sono2");
  for (const [d, a] of [
    ["2026-10-26T07:00", "2026-10-25T23:00"],
    ["2026-10-20T07:00", "2026-10-26T07:00"],
    ["2026-10-26T08:00", "2026-10-26T14:00"],
  ]) {
    const r = await criarSono(db, u.id, noite(d, a), SP, agora);
    assert.equal(r.ok, false, `${d} → ${a}`);
    assert.equal(!r.ok && r.status, 400);
  }
  assert.equal(await db.sono.count({ where: { userId: u.id } }), 0);
});

test("recusa sobreposição (409), mas aceita encostar", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "sono3");
  const base = await criarSono(db, u.id, noite("2026-10-25T23:00", "2026-10-26T07:00"), SP, agora);
  assert.ok(base.ok);

  const invade = await criarSono(db, u.id, noite("2026-10-26T06:00", "2026-10-26T08:00"), SP, agora);
  assert.equal(!invade.ok && invade.status, 409);
  assert.match(!invade.ok ? invade.erro : "", /sobrepõe/);

  const contem = await criarSono(db, u.id, noite("2026-10-25T22:00", "2026-10-26T09:00"), SP, agora);
  assert.equal(!contem.ok && contem.status, 409);

  const encosta = await criarSono(db, u.id, noite("2026-10-26T07:00", "2026-10-26T07:45"), SP, agora);
  assert.ok(encosta.ok, "acordar às 07:00 e voltar a dormir às 07:00 é válido");

  assert.equal(await db.sono.count({ where: { userId: u.id } }), 2);
});

test("duplo toque em Salvar: envios simultâneos do mesmo período gravam UM, rodada após rodada", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "sono4");
  // Uma corrida é probabilística: uma rodada só pode passar por sorte. Várias
  // rodadas, em períodos diferentes, é o que faz a falta da trava aparecer.
  for (let dia = 1; dia <= 6; dia++) {
    const d0 = `2026-10-${String(dia + 10).padStart(2, "0")}`;
    const d1 = `2026-10-${String(dia + 11).padStart(2, "0")}`;
    const resultados = await Promise.all(
      Array.from({ length: 8 }, () => criarSono(db, u.id, noite(`${d0}T23:00`, `${d1}T07:00`), SP, agora))
    );
    const aceitos = resultados.filter((r) => r.ok).length;
    const recusados = resultados.filter((r) => !r.ok && r.status === 409).length;
    assert.equal(aceitos, 1, `rodada ${dia}: ${aceitos} gravados`);
    assert.equal(recusados, 7, `rodada ${dia}`);
  }
  assert.equal(await db.sono.count({ where: { userId: u.id } }), 6);
});

test("editar: pode mover o próprio registro, mas não por cima de outro", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "sono5");
  const a = await criarSono(db, u.id, noite("2026-10-24T23:00", "2026-10-25T07:00"), SP, agora);
  const b = await criarSono(db, u.id, noite("2026-10-25T23:00", "2026-10-26T07:00"), SP, agora);
  assert.ok(a.ok && b.ok);

  // mexer um pouco no próprio horário não colide com ele mesmo
  const ajuste = await editarSono(db, u.id, a.valor.id, noite("2026-10-24T23:30", "2026-10-25T07:30", 5), SP, agora);
  assert.ok(ajuste.ok, ajuste.ok ? "" : ajuste.erro);
  assert.equal((await obterSono(db, u.id, a.valor.id))?.qualidade, 5);

  // empurrar para cima do outro colide
  const colide = await editarSono(db, u.id, a.valor.id, noite("2026-10-25T22:00", "2026-10-26T06:00"), SP, agora);
  assert.equal(!colide.ok && colide.status, 409);
  // e o registro ficou como estava antes da tentativa
  assert.equal((await obterSono(db, u.id, a.valor.id))?.dormiuEm.toISOString(), "2026-10-25T02:30:00.000Z");
});

test("autorização: outra pessoa não vê, não edita e não apaga o registro", opcoes, async () => {
  const dona = await criarUsuarioDeTeste(db, "dona3");
  const intrusa = await criarUsuarioDeTeste(db, "intrusa3");
  const r = await criarSono(db, dona.id, noite("2026-10-25T23:00", "2026-10-26T07:00", 4, "privado"), SP, agora);
  assert.ok(r.ok);
  const id = r.valor.id;

  assert.equal(await obterSono(db, intrusa.id, id), null);
  assert.deepEqual(await listarSono(db, intrusa.id), []);

  const edit = await editarSono(db, intrusa.id, id, noite("2026-10-25T22:00", "2026-10-26T06:00", 1, "hack"), SP, agora);
  assert.equal(!edit.ok && edit.status, 404);
  const del = await excluirSono(db, intrusa.id, id);
  assert.equal(!del.ok && del.status, 404);

  const intacto = await obterSono(db, dona.id, id);
  assert.equal(intacto?.nota, "privado");
  assert.equal(intacto?.qualidade, 4);

  // o intervalo da dona não bloqueia a intrusa gravar o dela no mesmo horário
  const mesmoHorario = await criarSono(db, intrusa.id, noite("2026-10-25T23:00", "2026-10-26T07:00"), SP, agora);
  assert.ok(mesmoHorario.ok, "sobreposição é checada só dentro da própria conta");
});

test("excluir remove de verdade; excluir de novo é 404", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "sono6");
  const r = await criarSono(db, u.id, noite("2026-10-25T23:00", "2026-10-26T07:00"), SP, agora);
  assert.ok(r.ok);
  assert.ok((await excluirSono(db, u.id, r.valor.id)).ok);
  assert.equal(await obterSono(db, u.id, r.valor.id), null);
  const de_novo = await excluirSono(db, u.id, r.valor.id);
  assert.equal(!de_novo.ok && de_novo.status, 404);
});

test("histórico em ordem e resumo de 7 dias vindo do banco: dia sem registro é null, não zero", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "sono7");
  await criarSono(db, u.id, noite("2026-10-22T23:00", "2026-10-23T07:00", 4), SP, agora); // 8h
  await criarSono(db, u.id, noite("2026-10-24T23:00", "2026-10-25T05:00", 2), SP, agora); // 6h
  await criarSono(db, u.id, noite("2026-09-01T23:00", "2026-09-02T07:00", 5), SP, agora); // fora da janela

  const { historico, resumo } = await carregarSono(db, u.id, SP, agora);
  assert.equal(historico.length, 3);
  assert.ok(historico[0].dormiuEm > historico[1].dormiuEm, "mais recente primeiro");

  assert.equal(resumo.noitesRegistradas, 2);
  assert.equal(resumo.mediaMs, 7 * HORA_MS); // (8h + 6h) / 2 — não / 7
  assert.equal(resumo.qualidadeMedia, 3);
  assert.equal(resumo.dias.filter((d) => d.totalMs === null).length, 5);
  assert.equal(resumo.dias[6].dia, "2026-10-26");
});

test("o fuso do usuário decide qual dia é a noite", opcoes, async () => {
  const toquio = await criarUsuarioDeTeste(db, "toquio2", "Asia/Tokyo");
  // 02:00–10:00 em Tóquio = 17:00–01:00 UTC do dia anterior
  const r = await criarSono(db, toquio.id, noite("2026-10-26T02:00", "2026-10-26T08:00"), "Asia/Tokyo",
    instanteLocal("2026-10-26T12:00", "Asia/Tokyo")!.getTime());
  assert.ok(r.ok);
  assert.equal(r.valor.dormiuEm.toISOString(), "2026-10-25T17:00:00.000Z");
  assert.equal(r.valor.acordouEm.toISOString(), "2026-10-25T23:00:00.000Z");
});

test("apagar o usuário apaga o sono dele (cascata)", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "sono8");
  await criarSono(db, u.id, noite("2026-10-25T23:00", "2026-10-26T07:00"), SP, agora);
  await db.user.delete({ where: { id: u.id } });
  assert.equal(await db.sono.count({ where: { userId: u.id } }), 0);
});
