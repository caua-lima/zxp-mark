import { test } from "node:test";
import assert from "node:assert/strict";
import { bancoEmMemoria } from "./memoria-db.ts";
import {
  arquivarHabito,
  atualizarHabito,
  carregarRastreio,
  editarEvento,
  excluirHabito,
  iniciarHabito,
  registrarEvento,
  removerEvento,
  type Db,
} from "./habitos.ts";
import { instanteLocal } from "../datas.ts";

const SP = "America/Sao_Paulo";
const agora = instanteLocal("2026-10-11T10:00", SP)!.getTime();
const antes = (dias: number) => agora - dias * 86_400_000;

function cenario() {
  const mem = bancoEmMemoria();
  return { mem, db: mem as unknown as Db };
}

test("iniciar é idempotente: repetir não duplica, e dez pedidos simultâneos geram um só acompanhamento", async () => {
  const { mem, db } = cenario();
  const a = await iniciarHabito(db, "ana", { temaId: "unhas" }, antes(10));
  const b = await iniciarHabito(db, "ana", { temaId: "unhas" }, agora);
  assert.ok(a.ok && b.ok);
  assert.equal(a.ok && b.ok && a.valor.id, b.ok && b.valor.id);
  // o início original é preservado: a contagem nunca anda para frente por repetição
  assert.equal(b.ok && b.valor.inicio.getTime(), antes(10));

  const rajada = await Promise.all(Array.from({ length: 10 }, () => iniciarHabito(db, "bia", { temaId: "unhas" }, agora)));
  assert.ok(rajada.every((r) => r.ok));
  assert.equal(mem.habitoAcompanhado.linhas.filter((l) => l.userId === "bia").length, 1);
});

test("só inicia temas que têm acompanhamento por registros", async () => {
  const { db } = cenario();
  const inexistente = await iniciarHabito(db, "ana", { temaId: "nao-existe" }, agora);
  assert.equal(!inexistente.ok && inexistente.status, 404);
});

test("objetivo e meta pessoais são validados e opcionais", async () => {
  const { db } = cenario();
  assert.equal((await iniciarHabito(db, "ana", { temaId: "unhas", objetivo: "x".repeat(301) }, agora)).ok, false);
  assert.equal((await iniciarHabito(db, "ana", { temaId: "unhas", metaSemanal: -1 }, agora)).ok, false);
  const r = await iniciarHabito(db, "ana", { temaId: "unhas", objetivo: "  mãos bonitas no casamento ", metaSemanal: 5 }, agora);
  assert.ok(r.ok);
  assert.equal(r.ok && r.valor.objetivo, "mãos bonitas no casamento");
  assert.equal(r.ok && r.valor.metaSemanal, 5);
});

test("registrar: episódio, vontade e 'hoje não roí' ficam guardados com o dia no fuso do usuário", async () => {
  const { mem, db } = cenario();
  await iniciarHabito(db, "ana", { temaId: "unhas" }, antes(5));

  const ep = await registrarEvento(db, "ana", "unhas", { tipo: "episodio", contexto: "tedio", intensidade: 3, desconforto: 2 }, SP, agora);
  assert.ok(ep.ok);
  assert.equal(ep.ok && ep.valor.evento.dia, "2026-10-11");
  const v = await registrarEvento(db, "ana", "unhas", { tipo: "vontade", contexto: "trabalho", estrategia: "bolinha" }, SP, agora);
  assert.ok(v.ok);
  const d = await registrarEvento(db, "ana", "unhas", { tipo: "dia_sem", dia: "2026-10-10" }, SP, agora);
  assert.ok(d.ok);
  assert.equal(mem.eventoHabito.linhas.length, 3);
});

test("confirmar o mesmo dia duas vezes (toque duplo) não cria um segundo registro nem infla a contagem", async () => {
  const { mem, db } = cenario();
  await iniciarHabito(db, "ana", { temaId: "unhas" }, antes(5));

  // Em corrida, o schema não tem índice único para `dia_sem` (um dia pode ter vários
  // episódios, então não dá para impor unicidade por tipo). Uma duplicata pode nascer —
  // e é inofensiva POR DESENHO: toda métrica conta dias DISTINTOS.
  const rs = await Promise.all(Array.from({ length: 5 }, () => registrarEvento(db, "ana", "unhas", { tipo: "dia_sem", dia: "2026-10-10" }, SP, agora)));
  assert.ok(rs.every((r) => r.ok));
  const r = await carregarRastreio(db, "ana", "unhas", SP, agora);
  assert.equal(r?.resumo.totalDiasConfirmados, 1, "cinco toques, um dia confirmado");
  assert.equal(r?.resumo.sequenciaConfirmada, 1);

  // Sequencialmente é exato: a segunda chamada reconhece a primeira e não grava.
  const dois = await registrarEvento(db, "ana", "unhas", { tipo: "dia_sem", dia: "2026-10-09" }, SP, agora);
  const tres = await registrarEvento(db, "ana", "unhas", { tipo: "dia_sem", dia: "2026-10-09" }, SP, agora);
  assert.ok(dois.ok && tres.ok);
  assert.equal(dois.ok && dois.valor.repetido, false);
  assert.equal(tres.ok && tres.valor.repetido, true);
  assert.equal(mem.eventoHabito.linhas.filter((l) => l.dia === "2026-10-09").length, 1);
});

test("episódio no dia de uma confirmação a substitui; confirmar um dia com episódio é recusado", async () => {
  const { mem, db } = cenario();
  await iniciarHabito(db, "ana", { temaId: "unhas" }, antes(5));
  await registrarEvento(db, "ana", "unhas", { tipo: "dia_sem", dia: "2026-10-10" }, SP, agora);
  assert.equal(mem.eventoHabito.linhas.length, 1);

  const ep = await registrarEvento(db, "ana", "unhas", { tipo: "episodio", dia: "2026-10-10" }, SP, agora);
  assert.ok(ep.ok);
  assert.deepEqual(mem.eventoHabito.linhas.map((l) => l.tipo), ["episodio"], "a confirmação saiu, o episódio ficou");

  const volta = await registrarEvento(db, "ana", "unhas", { tipo: "dia_sem", dia: "2026-10-10" }, SP, agora);
  assert.equal(!volta.ok && volta.status, 409);
  assert.match(!volta.ok ? volta.erro : "", /apague o episódio/);
});

test("registro retroativo é aceito dentro do período; fora dele, não", async () => {
  const { db } = cenario();
  await iniciarHabito(db, "ana", { temaId: "unhas" }, antes(5)); // início em 06/out
  assert.ok((await registrarEvento(db, "ana", "unhas", { tipo: "dia_sem", dia: "2026-10-07" }, SP, agora)).ok);
  const antesDoInicio = await registrarEvento(db, "ana", "unhas", { tipo: "dia_sem", dia: "2026-10-01" }, SP, agora);
  assert.equal(antesDoInicio.ok, false);
  const futuro = await registrarEvento(db, "ana", "unhas", { tipo: "dia_sem", dia: "2026-10-12" }, SP, agora);
  assert.equal(futuro.ok, false);
});

test("sem acompanhamento iniciado, não há onde registrar", async () => {
  const { db } = cenario();
  const r = await registrarEvento(db, "ana", "unhas", { tipo: "dia_sem" }, SP, agora);
  assert.equal(!r.ok && r.status, 404);
});

test("editar um registro valida de novo, e remover apaga só o registro pedido", async () => {
  const { mem, db } = cenario();
  await iniciarHabito(db, "ana", { temaId: "unhas" }, antes(5));
  const e = await registrarEvento(db, "ana", "unhas", { tipo: "episodio", contexto: "tedio", intensidade: 2 }, SP, agora);
  assert.ok(e.ok);
  const id = e.ok ? e.valor.evento.id : "";

  assert.ok((await editarEvento(db, "ana", id, { contexto: "trabalho", intensidade: 4, nota: "reunião longa" }, SP, agora)).ok);
  const depois = mem.eventoHabito.linhas[0];
  assert.deepEqual([depois.contexto, depois.intensidade, depois.nota], ["trabalho", 4, "reunião longa"]);

  assert.equal((await editarEvento(db, "ana", id, { intensidade: 9 }, SP, agora)).ok, false);
  assert.equal((await editarEvento(db, "ana", id, { contexto: "festa" }, SP, agora)).ok, false);
  assert.equal(mem.eventoHabito.linhas[0].intensidade, 4, "edição inválida não altera nada");

  await registrarEvento(db, "ana", "unhas", { tipo: "vontade" }, SP, agora);
  assert.ok((await removerEvento(db, "ana", id)).ok);
  assert.equal(mem.eventoHabito.linhas.length, 1);
  assert.equal(mem.eventoHabito.linhas[0].tipo, "vontade");
});

/* ------------------------ ISOLAMENTO ENTRE USUÁRIOS ----------------------- */

test("outra pessoa não vê, não registra, não edita e não apaga nada do acompanhamento alheio", async () => {
  const { mem, db } = cenario();
  await iniciarHabito(db, "dona", { temaId: "unhas", objetivo: "privado" }, antes(5));
  const e = await registrarEvento(db, "dona", "unhas", { tipo: "episodio", contexto: "tedio", nota: "segredo" }, SP, agora);
  const idDoEvento = e.ok ? e.valor.evento.id : "";

  // quem não tem acompanhamento próprio não consegue registrar em "unhas"
  const invasao = await registrarEvento(db, "intrusa", "unhas", { tipo: "dia_sem" }, SP, agora);
  assert.equal(!invasao.ok && invasao.status, 404);

  assert.equal(await carregarRastreio(db, "intrusa", "unhas", SP, agora), null);
  assert.equal(!(await editarEvento(db, "intrusa", idDoEvento, { nota: "hack" }, SP, agora)).ok, true);
  assert.equal(!(await removerEvento(db, "intrusa", idDoEvento)).ok, true);
  assert.equal(!(await arquivarHabito(db, "intrusa", "unhas", true, agora)).ok, true);
  assert.equal(!(await excluirHabito(db, "intrusa", "unhas")).ok, true);
  assert.equal(!(await atualizarHabito(db, "intrusa", "unhas", { objetivo: "hack" })).ok, true);

  // e o da dona continua exatamente como estava
  const intacto = mem.eventoHabito.linhas[0];
  assert.equal(intacto.nota, "segredo");
  assert.equal(mem.habitoAcompanhado.linhas[0].objetivo, "privado");
  assert.equal(mem.habitoAcompanhado.linhas[0].arquivadoEm ?? null, null);
});

test("dois usuários com o mesmo tema têm acompanhamentos independentes", async () => {
  const { mem, db } = cenario();
  await iniciarHabito(db, "ana", { temaId: "unhas" }, antes(5));
  await iniciarHabito(db, "bia", { temaId: "unhas" }, antes(5));
  await registrarEvento(db, "ana", "unhas", { tipo: "episodio" }, SP, agora);
  await registrarEvento(db, "bia", "unhas", { tipo: "dia_sem" }, SP, agora);

  const ana = await carregarRastreio(db, "ana", "unhas", SP, agora);
  const bia = await carregarRastreio(db, "bia", "unhas", SP, agora);
  assert.equal(ana?.resumo.totalEpisodios, 1);
  assert.equal(ana?.resumo.totalDiasConfirmados, 0);
  assert.equal(bia?.resumo.totalEpisodios, 0);
  assert.equal(bia?.resumo.totalDiasConfirmados, 1);
  assert.equal(mem.habitoAcompanhado.linhas.length, 2);
});

test("'não é seu' e 'não existe' devolvem exatamente a mesma resposta", async () => {
  const { db } = cenario();
  await iniciarHabito(db, "dona", { temaId: "unhas" }, antes(5));
  const e = await registrarEvento(db, "dona", "unhas", { tipo: "episodio" }, SP, agora);
  const id = e.ok ? e.valor.evento.id : "";
  assert.deepEqual(await removerEvento(db, "intrusa", id), await removerEvento(db, "intrusa", "id-que-nao-existe"));
  assert.deepEqual(await editarEvento(db, "intrusa", id, { nota: "x" }, SP, agora), await editarEvento(db, "intrusa", "id-que-nao-existe", { nota: "x" }, SP, agora));
});

/* ------------------------ arquivar, apagar, ler --------------------------- */

test("arquivar bloqueia novos registros e preserva o histórico; reiniciar desarquiva sem perder nada", async () => {
  const { mem, db } = cenario();
  await iniciarHabito(db, "ana", { temaId: "unhas" }, antes(5));
  await registrarEvento(db, "ana", "unhas", { tipo: "dia_sem", dia: "2026-10-10" }, SP, agora);

  assert.ok((await arquivarHabito(db, "ana", "unhas", true, agora)).ok);
  const bloqueado = await registrarEvento(db, "ana", "unhas", { tipo: "dia_sem" }, SP, agora);
  assert.equal(!bloqueado.ok && bloqueado.status, 404);
  assert.equal(mem.eventoHabito.linhas.length, 1, "o histórico continua");

  const volta = await iniciarHabito(db, "ana", { temaId: "unhas" }, agora);
  assert.ok(volta.ok);
  assert.equal(volta.ok && volta.valor.arquivadoEm, null);
  assert.equal(volta.ok && volta.valor.inicio.getTime(), antes(5), "o início original fica");
  assert.equal(mem.eventoHabito.linhas.length, 1);
  assert.ok((await registrarEvento(db, "ana", "unhas", { tipo: "dia_sem" }, SP, agora)).ok);
});

test("apagar o acompanhamento remove também todos os registros (direito de remover)", async () => {
  const { mem, db } = cenario();
  await iniciarHabito(db, "ana", { temaId: "unhas" }, antes(5));
  await iniciarHabito(db, "bia", { temaId: "unhas" }, antes(5));
  await registrarEvento(db, "ana", "unhas", { tipo: "episodio", nota: "a" }, SP, agora);
  await registrarEvento(db, "bia", "unhas", { tipo: "episodio", nota: "b" }, SP, agora);

  assert.ok((await excluirHabito(db, "ana", "unhas")).ok);
  assert.equal(mem.eventoHabito.linhas.length, 1);
  assert.equal(mem.eventoHabito.linhas[0].nota, "b", "só os registros de quem apagou");
  assert.equal(await carregarRastreio(db, "ana", "unhas", SP, agora), null);
});

test("carregar devolve resumo, marcos, frequência, contexto e estratégias a partir dos registros", async () => {
  const { db } = cenario();
  await iniciarHabito(db, "ana", { temaId: "unhas" }, antes(10)); // início em 01/out
  for (let d = 1; d <= 10; d++) {
    await registrarEvento(db, "ana", "unhas", { tipo: "dia_sem", dia: `2026-10-${String(d + 1).padStart(2, "0")}` }, SP, agora);
  }
  await registrarEvento(db, "ana", "unhas", { tipo: "vontade", contexto: "tedio", estrategia: "bolinha" }, SP, agora);

  const r = await carregarRastreio(db, "ana", "unhas", SP, agora);
  assert.ok(r);
  assert.equal(r.resumo.sequenciaConfirmada, 10);
  const dez = r.marcos.find((m) => m.marco.limiar === 10)!;
  assert.equal(dez.estado, "sustentado");
  assert.equal(r.semanas.length, 4);
  assert.deepEqual(r.contextoMaisFrequente, { contexto: "tedio", vezes: 1 });
  assert.deepEqual(r.estrategias, [{ estrategia: "bolinha", vezes: 1 }]);
});
