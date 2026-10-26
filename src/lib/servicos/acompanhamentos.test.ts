/**
 * Integração com o banco real — só roda com ZXP_TESTE_DB=1 (ver teste-db.ts).
 *   ZXP_TESTE_DB=1 npm test
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
  arquivarAcompanhamento,
  criarAcompanhamento,
  editarAcompanhamento,
  excluirAcompanhamento,
  listarAcompanhamentos,
  obterAcompanhamento,
} from "./acompanhamentos.ts";
import { instanteLocal } from "../datas.ts";

const SP = "America/Sao_Paulo";
const agora = instanteLocal("2026-10-26T10:00", SP)!.getTime();
const opcoes = { skip: !TESTE_DB_LIGADO && "defina ZXP_TESTE_DB=1 para rodar contra o banco" };

const db = TESTE_DB_LIGADO ? abrirBanco() : (null as never);

after(async () => {
  if (!TESTE_DB_LIGADO) return;
  await limparUsuariosDeTeste(db);
  await db.$disconnect();
});

test("persiste: o que foi criado e editado volta igual numa leitura nova", opcoes, async () => {
  const ana = await criarUsuarioDeTeste(db, "ana");

  const c = await criarAcompanhamento(
    db, ana.id,
    { titulo: "Início do tratamento", categoria: "tratamento", inicio: "2026-10-14", emoji: "💊", tom: "marfim" },
    SP, agora
  );
  assert.ok(c.ok, c.ok ? "" : c.erro);

  const lido = await obterAcompanhamento(db, ana.id, c.valor.id);
  assert.equal(lido?.titulo, "Início do tratamento");
  assert.equal(lido?.categoria, "tratamento");
  assert.equal(lido?.emoji, "💊");
  assert.equal(lido?.tom, "marfim");
  assert.equal(lido?.inicio.toISOString(), "2026-10-14T03:00:00.000Z");
  assert.equal(lido?.arquivadoEm, null);

  const e = await editarAcompanhamento(db, ana.id, c.valor.id, { titulo: "Tratamento novo", inicio: "2026-10-10T08:30" }, SP, agora);
  assert.ok(e.ok);

  const depois = await obterAcompanhamento(db, ana.id, c.valor.id);
  assert.equal(depois?.titulo, "Tratamento novo");
  assert.equal(depois?.inicio.toISOString(), "2026-10-10T11:30:00.000Z");
  assert.equal(depois?.emoji, "💊"); // o que não foi enviado não muda

  const lista = await listarAcompanhamentos(db, ana.id, { arquivados: false });
  assert.deepEqual(lista.map((x) => x.id), [c.valor.id]);
});

test("autorização: outra pessoa não vê, não edita, não arquiva e não apaga", opcoes, async () => {
  const dona = await criarUsuarioDeTeste(db, "dona");
  const intrusa = await criarUsuarioDeTeste(db, "intrusa");

  const c = await criarAcompanhamento(db, dona.id, { titulo: "Meu projeto", categoria: "projeto", inicio: "2026-10-01" }, SP, agora);
  assert.ok(c.ok);
  const id = c.valor.id;

  assert.equal(await obterAcompanhamento(db, intrusa.id, id), null);
  assert.deepEqual(await listarAcompanhamentos(db, intrusa.id, { arquivados: false }), []);

  const edit = await editarAcompanhamento(db, intrusa.id, id, { titulo: "Invadido" }, SP, agora);
  assert.equal(edit.ok, false);
  assert.equal(!edit.ok && edit.status, 404);

  const arq = await arquivarAcompanhamento(db, intrusa.id, id, true, agora);
  assert.equal(arq.ok, false);
  assert.equal(!arq.ok && arq.status, 404);

  const del = await excluirAcompanhamento(db, intrusa.id, id);
  assert.equal(del.ok, false);
  assert.equal(!del.ok && del.status, 404);

  // e o registro da dona está intacto depois de tudo isso
  const intacto = await obterAcompanhamento(db, dona.id, id);
  assert.equal(intacto?.titulo, "Meu projeto");
  assert.equal(intacto?.arquivadoEm, null);
});

test("'não é seu' e 'não existe' são indistinguíveis de fora", opcoes, async () => {
  const a = await criarUsuarioDeTeste(db, "a");
  const b = await criarUsuarioDeTeste(db, "b");
  const c = await criarAcompanhamento(db, a.id, { titulo: "Privado", inicio: "2026-10-01" }, SP, agora);
  assert.ok(c.ok);

  const alheio = await editarAcompanhamento(db, b.id, c.valor.id, { titulo: "x" }, SP, agora);
  const inexistente = await editarAcompanhamento(db, b.id, "id-que-nao-existe", { titulo: "x" }, SP, agora);
  assert.deepEqual(alheio, inexistente);
});

test("arquivar guarda o histórico fora da lista principal, e desarquivar devolve", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "arq");
  const c = await criarAcompanhamento(db, u.id, { titulo: "Rotina antiga", categoria: "rotina", inicio: "2026-09-01" }, SP, agora);
  assert.ok(c.ok);

  const arq = await arquivarAcompanhamento(db, u.id, c.valor.id, true, agora);
  assert.ok(arq.ok);
  assert.deepEqual(await listarAcompanhamentos(db, u.id, { arquivados: false }), []);
  const arquivados = await listarAcompanhamentos(db, u.id, { arquivados: true });
  assert.equal(arquivados.length, 1);
  assert.equal(arquivados[0].arquivadoEm?.getTime(), agora);
  assert.equal(arquivados[0].inicio.toISOString(), "2026-09-01T03:00:00.000Z"); // nada se perde

  await arquivarAcompanhamento(db, u.id, c.valor.id, false, agora);
  assert.equal((await listarAcompanhamentos(db, u.id, { arquivados: false })).length, 1);
});

test("validação do servidor: dados inválidos não chegam ao banco", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "val");
  const futuro = await criarAcompanhamento(db, u.id, { titulo: "Futuro", inicio: "2027-01-01" }, SP, agora);
  assert.equal(futuro.ok, false);
  const semNome = await criarAcompanhamento(db, u.id, { titulo: "", inicio: "2026-10-01" }, SP, agora);
  assert.equal(semNome.ok, false);
  assert.equal((await listarAcompanhamentos(db, u.id, { arquivados: false })).length, 0);
});

test("o fuso do usuário decide o instante guardado", opcoes, async () => {
  const toquio = await criarUsuarioDeTeste(db, "toquio", "Asia/Tokyo");
  const c = await criarAcompanhamento(db, toquio.id, { titulo: "Lá", inicio: "2026-10-14T08:00" }, "Asia/Tokyo", agora);
  assert.ok(c.ok);
  assert.equal(c.valor.inicio.toISOString(), "2026-10-13T23:00:00.000Z");
});

test("apagar o usuário apaga os acompanhamentos dele (cascata)", opcoes, async () => {
  const u = await criarUsuarioDeTeste(db, "cascata");
  await criarAcompanhamento(db, u.id, { titulo: "Some junto", inicio: "2026-10-01" }, SP, agora);
  await db.user.delete({ where: { id: u.id } });
  assert.equal(await db.acompanhamento.count({ where: { userId: u.id } }), 0);
});
