import { test } from "node:test";
import assert from "node:assert/strict";
import { bancoEmMemoria } from "./memoria-db.ts";
import {
  arquivarTratamento,
  atualizarTratamento,
  carregarTratamento,
  criarTratamento,
  excluirTratamento,
  registrarDose,
  registrarEfeito,
  registrarTomada,
  removerDose,
  removerEfeito,
  removerTomada,
  type Db,
} from "./tratamento.ts";
import { listarHumor, registrarHumor, removerHumor, type Db as DbHumor } from "./humor.ts";
import { instanteLocal } from "../datas.ts";

const SP = "America/Sao_Paulo";
const agora = instanteLocal("2026-10-11T10:00", SP)!.getTime(); // hoje = 2026-10-11

// Valores de TESTE. Nada disto é dado de ninguém: cada teste cria o próprio cenário em memória.
function cenario() {
  const mem = bancoEmMemoria();
  return { mem, db: mem as unknown as Db, dbHumor: mem as unknown as DbHumor };
}
async function comTratamento(db: Db, uid = "ana", extra: Partial<Parameters<typeof criarTratamento>[2]> = {}) {
  const r = await criarTratamento(db, uid, { nome: "escitalopram", inicio: "2026-09-11", ...extra }, SP, agora);
  assert.ok(r.ok, r.ok ? "" : r.erro);
  return r.ok ? r.valor : (null as never);
}

/* ------------------------------- criação ---------------------------------- */

test("nome exato salva com o nome canônico e o tema do catálogo", async () => {
  const { db } = cenario();
  const t = await comTratamento(db, "ana", { nome: "Oxalato de Escitalopram" });
  assert.equal(t.medicamentoId, "escitalopram");
  assert.equal(t.nome, "Escitalopram");
  assert.equal(t.inicio.toISOString(), "2026-09-11T03:00:00.000Z");
});

test("erro de digitação NÃO salva sem confirmação; confirmando, salva com o nome certo", async () => {
  const { mem, db } = cenario();
  const sem = await criarTratamento(db, "ana", { nome: "exscitalopram", inicio: "2026-09-11" }, SP, agora);
  assert.equal(!sem.ok && sem.status, 409);
  assert.match(!sem.ok ? sem.erro : "", /Você quis dizer “Escitalopram”\?/);
  assert.equal(mem.tratamento.linhas.length, 0, "nada foi gravado");

  const com = await criarTratamento(db, "ana", { nome: "exscitalopram", confirmouSugestao: true, inicio: "2026-09-11" }, SP, agora);
  assert.ok(com.ok);
  assert.equal(com.ok && com.valor.nome, "Escitalopram");
  assert.equal(com.ok && com.valor.medicamentoId, "escitalopram");
});

test("citalopram NUNCA vira escitalopram, nem confirmando: fica como 'outro', com o nome digitado", async () => {
  const { db } = cenario();
  for (const confirmou of [false, true]) {
    const r = await criarTratamento(db, "ana", { nome: "citalopram", confirmouSugestao: confirmou, inicio: "2026-09-11" }, SP, agora);
    assert.ok(r.ok);
    assert.equal(r.ok && r.valor.medicamentoId, "outro");
    assert.equal(r.ok && r.valor.nome, "citalopram");
  }
});

test("início do tratamento e início da dose atual são coisas diferentes, e a dose é opcional", async () => {
  const { mem, db } = cenario();
  const t = await comTratamento(db, "ana", { dose: { descricao: "15 mg", mg: 15, desde: "2026-10-08" } });
  assert.equal(t.inicio.toISOString(), "2026-09-11T03:00:00.000Z");
  assert.equal((mem.doseTratamento.linhas[0].desde as Date).toISOString(), "2026-10-08T03:00:00.000Z");
  assert.notEqual(
    (mem.doseTratamento.linhas[0].desde as Date).getTime(),
    t.inicio.getTime(),
    "a dose não presume que o tratamento começou nela"
  );
  // sem dose informada: nenhuma dose é inventada
  const { mem: m2, db: d2 } = cenario();
  await comTratamento(d2, "bia");
  assert.equal(m2.doseTratamento.linhas.length, 0);
});

test("dose sem 'desde' assume o início do tratamento; dose antes do início é recusada sem criar nada", async () => {
  const { mem, db } = cenario();
  const t = await comTratamento(db, "ana", { dose: { descricao: "10 mg" } });
  assert.equal((mem.doseTratamento.linhas[0].desde as Date).getTime(), t.inicio.getTime());

  const { mem: m2, db: d2 } = cenario();
  const ruim = await criarTratamento(d2, "ana", { nome: "escitalopram", inicio: "2026-09-11", dose: { descricao: "10 mg", desde: "2026-08-01" } }, SP, agora);
  assert.equal(ruim.ok, false);
  assert.equal(m2.tratamento.linhas.length, 0, "dose inválida não deixa tratamento pela metade");
});

test("início futuro, data impossível, horário inválido e nome vazio são recusados", async () => {
  const { db } = cenario();
  const base = { nome: "escitalopram", inicio: "2026-09-11" };
  for (const e of [{ ...base, inicio: "2026-10-12" }, { ...base, inicio: "2026-02-30" }, { ...base, horario: "25:00" }, { ...base, nome: "  " }, { ...base, inicio: "1900-01-01" }]) {
    assert.equal((await criarTratamento(db, "ana", e, SP, agora)).ok, false, JSON.stringify(e));
  }
});

/* -------------------------------- tomadas --------------------------------- */

test("registrar a tomada de hoje, e editar o mesmo dia atualiza em vez de duplicar", async () => {
  const { mem, db } = cenario();
  const t = await comTratamento(db);
  const a = await registrarTomada(db, "ana", t.id, { estado: "tomou", horario: "08:30" }, SP, agora);
  assert.ok(a.ok && a.valor.criada);
  const b = await registrarTomada(db, "ana", t.id, { estado: "nao_tomou", nota: "enjoo" }, SP, agora);
  assert.ok(b.ok && !b.valor.criada);
  assert.equal(mem.tomadaDia.linhas.length, 1);
  assert.equal(mem.tomadaDia.linhas[0].estado, "nao_tomou");
  assert.equal(mem.tomadaDia.linhas[0].horario, null, "'não tomei' não guarda horário");
});

test("toque duplo: cinco registros simultâneos do mesmo dia geram UMA linha", async () => {
  const { mem, db } = cenario();
  const t = await comTratamento(db);
  const rs = await Promise.all(Array.from({ length: 5 }, () => registrarTomada(db, "ana", t.id, { estado: "tomou", dia: "2026-10-10" }, SP, agora)));
  assert.ok(rs.every((r) => r.ok));
  assert.equal(mem.tomadaDia.linhas.filter((l) => l.dia === "2026-10-10").length, 1, "o índice único (tratamento, dia) impede a duplicata");
});

test("retroativo dentro do período vale; antes do início e no futuro, não", async () => {
  const { db } = cenario();
  const t = await comTratamento(db);
  assert.ok((await registrarTomada(db, "ana", t.id, { estado: "tomou", dia: "2026-09-20" }, SP, agora)).ok);
  assert.equal((await registrarTomada(db, "ana", t.id, { estado: "tomou", dia: "2026-08-01" }, SP, agora)).ok, false);
  assert.equal((await registrarTomada(db, "ana", t.id, { estado: "tomou", dia: "2026-10-12" }, SP, agora)).ok, false);
});

test("marcar 'esqueci' recomeça a sequência; apagar a marcação a devolve, sem virar 'esqueci'", async () => {
  const { db } = cenario();
  const t = await comTratamento(db);
  assert.equal((await carregarTratamento(db, "ana", t.id, SP, agora))?.resumo.sequenciaConfirmada, 30, "presumido: do início até ontem");
  await registrarTomada(db, "ana", t.id, { estado: "nao_tomou", dia: "2026-10-10" }, SP, agora);
  const esqueceu = (await carregarTratamento(db, "ana", t.id, SP, agora))!;
  assert.equal(esqueceu.resumo.sequenciaConfirmada, 0);
  assert.equal(esqueceu.resumo.totalNaoTomou, 1);
  assert.equal(esqueceu.resumo.desdeInicio.completos, 30, "o tratamento segue contando");
  assert.ok((await removerTomada(db, "ana", t.id, "2026-10-10")).ok);
  const r = (await carregarTratamento(db, "ana", t.id, SP, agora))!;
  assert.equal(r.resumo.sequenciaConfirmada, 30);
  assert.equal(r.resumo.totalNaoTomou, 0, "apagar a marcação não vira 'esqueci'");
  assert.equal((await removerTomada(db, "ana", t.id, "2026-10-10")).ok, false, "apagar de novo: não existe");
});

/* --------------------------------- doses ---------------------------------- */

test("mudar a dose ACRESCENTA ao histórico e não mexe em mais nada", async () => {
  const { mem, db } = cenario();
  const t = await comTratamento(db, "ana", { dose: { descricao: "10 mg", mg: 10 } });
  for (let d = 1; d <= 10; d++) await registrarTomada(db, "ana", t.id, { estado: "tomou", dia: `2026-10-${String(d + 1).padStart(2, "0")}` }, SP, agora);
  const antes = (await carregarTratamento(db, "ana", t.id, SP, agora))!;

  const nova = await registrarDose(db, "ana", t.id, { descricao: "15 mg", mg: 15, desde: "2026-10-08" }, SP, agora);
  assert.ok(nova.ok && !nova.valor.repetida);
  const depois = (await carregarTratamento(db, "ana", t.id, SP, agora))!;

  assert.equal(depois.doses.length, 2, "as duas doses ficam no histórico");
  assert.equal(depois.resumo.doseAtual?.descricao, "15 mg");
  assert.equal(depois.resumo.doseAtual?.contagem.completos, 3);
  // nada mais mudou:
  assert.equal(depois.resumo.desdeInicio.completos, antes.resumo.desdeInicio.completos);
  assert.equal(depois.resumo.sequenciaConfirmada, antes.resumo.sequenciaConfirmada);
  assert.equal(depois.resumo.totalRegistrados, antes.resumo.totalRegistrados);
  assert.equal(depois.tratamento.inicio.getTime(), antes.tratamento.inicio.getTime());
  assert.equal(mem.tomadaDia.linhas.length, 10);
  assert.deepEqual(depois.cartoes.map((c) => c.estado), antes.cartoes.map((c) => c.estado));
});

test("informar a mesma dose duas vezes não duplica; dose antes do início é recusada", async () => {
  const { mem, db } = cenario();
  const t = await comTratamento(db);
  const a = await registrarDose(db, "ana", t.id, { descricao: "15 mg", desde: "2026-10-08" }, SP, agora);
  const b = await registrarDose(db, "ana", t.id, { descricao: "15 mg", desde: "2026-10-08" }, SP, agora);
  assert.ok(a.ok && b.ok);
  assert.equal(b.ok && b.valor.repetida, true);
  assert.equal(mem.doseTratamento.linhas.length, 1);
  assert.equal((await registrarDose(db, "ana", t.id, { descricao: "10 mg", desde: "2026-08-01" }, SP, agora)).ok, false);
});

test("o app não julga a dose: qualquer valor plausível informado é guardado como informado", async () => {
  const { mem, db } = cenario();
  const t = await comTratamento(db);
  for (const [i, d] of ["5 mg", "10 mg", "15 mg", "40 mg"].entries()) {
    assert.ok((await registrarDose(db, "ana", t.id, { descricao: d, desde: `2026-10-0${i + 1}` }, SP, agora)).ok, d);
  }
  assert.equal(mem.doseTratamento.linhas.length, 4);
});

test("corrigir uma dose digitada errada: apagar só aquela linha do histórico", async () => {
  const { mem, db } = cenario();
  const t = await comTratamento(db);
  const a = await registrarDose(db, "ana", t.id, { descricao: "15 mg", desde: "2026-10-01" }, SP, agora);
  await registrarDose(db, "ana", t.id, { descricao: "10 mg", desde: "2026-10-05" }, SP, agora);
  assert.ok((await removerDose(db, "ana", a.ok ? a.valor.dose.id : "")).ok);
  assert.deepEqual(mem.doseTratamento.linhas.map((l) => l.descricao), ["10 mg"]);
});

/* -------------------------------- efeitos --------------------------------- */

test("registrar e apagar efeitos indesejados; o app guarda e não interpreta", async () => {
  const { mem, db } = cenario();
  const t = await comTratamento(db);
  const e = await registrarEfeito(db, "ana", t.id, { descricao: "enjoo ao acordar", intensidade: 2 }, SP, agora);
  assert.ok(e.ok);
  assert.equal(mem.efeitoRegistrado.linhas.length, 1);
  assert.equal((await registrarEfeito(db, "ana", t.id, { descricao: "x" }, SP, agora)).ok, false);
  assert.ok((await removerEfeito(db, "ana", e.ok ? e.valor.id : "")).ok);
  assert.equal(mem.efeitoRegistrado.linhas.length, 0);
});

/* ------------------------ ISOLAMENTO ENTRE USUÁRIOS ----------------------- */

test("outra pessoa não vê, não registra, não edita, não apaga e não lê o resumo do tratamento alheio", async () => {
  const { mem, db } = cenario();
  const t = await comTratamento(db, "dona", { dose: { descricao: "15 mg", mg: 15, desde: "2026-10-08" } });
  await registrarTomada(db, "dona", t.id, { estado: "tomou", nota: "privado" }, SP, agora);
  const e = await registrarEfeito(db, "dona", t.id, { descricao: "dor de cabeça" }, SP, agora);
  const antes = JSON.stringify([mem.tratamento.linhas, mem.doseTratamento.linhas, mem.tomadaDia.linhas, mem.efeitoRegistrado.linhas]);

  assert.equal(await carregarTratamento(db, "intrusa", t.id, SP, agora), null);
  assert.equal((await registrarTomada(db, "intrusa", t.id, { estado: "tomou" }, SP, agora)).ok, false);
  assert.equal((await registrarDose(db, "intrusa", t.id, { descricao: "99 mg", desde: "2026-10-09" }, SP, agora)).ok, false);
  assert.equal((await registrarEfeito(db, "intrusa", t.id, { descricao: "invasão" }, SP, agora)).ok, false);
  assert.equal((await removerTomada(db, "intrusa", t.id, agora ? "2026-10-11" : "")).ok, false);
  assert.equal((await removerEfeito(db, "intrusa", e.ok ? e.valor.id : "")).ok, false);
  assert.equal((await atualizarTratamento(db, "intrusa", t.id, { horario: "03:00" })).ok, false);
  assert.equal((await arquivarTratamento(db, "intrusa", t.id, true, agora)).ok, false);
  assert.equal((await excluirTratamento(db, "intrusa", t.id)).ok, false);

  const depois = JSON.stringify([mem.tratamento.linhas, mem.doseTratamento.linhas, mem.tomadaDia.linhas, mem.efeitoRegistrado.linhas]);
  assert.equal(depois, antes, "nada do tratamento alheio mudou, por nenhum caminho");
});

test("'não é seu' e 'não existe' devolvem exatamente a mesma resposta", async () => {
  const { db } = cenario();
  const t = await comTratamento(db, "dona");
  assert.deepEqual(
    await registrarTomada(db, "intrusa", t.id, { estado: "tomou" }, SP, agora),
    await registrarTomada(db, "intrusa", "id-que-nao-existe", { estado: "tomou" }, SP, agora)
  );
  assert.deepEqual(await excluirTratamento(db, "intrusa", t.id), await excluirTratamento(db, "intrusa", "id-que-nao-existe"));
});

test("dois usuários com o mesmo medicamento têm históricos independentes", async () => {
  const { db } = cenario();
  const a = await comTratamento(db, "ana");
  const b = await comTratamento(db, "bia");
  await registrarTomada(db, "ana", a.id, { estado: "tomou" }, SP, agora);
  assert.equal((await carregarTratamento(db, "ana", a.id, SP, agora))?.resumo.totalRegistrados, 1);
  assert.equal((await carregarTratamento(db, "bia", b.id, SP, agora))?.resumo.totalRegistrados, 0);
});

/* ------------------- lembrete, arquivar, apagar, ler ---------------------- */

test("lembrete é opt-in, exige horário, e o texto detalhado exige o lembrete ligado", async () => {
  const { db } = cenario();
  const t = await comTratamento(db);
  assert.equal(t.lembrete, false);
  assert.equal(t.lembreteDetalhado, false);
  const sem = await atualizarTratamento(db, "ana", t.id, { lembrete: true });
  assert.equal(sem.ok, false);
  assert.match(!sem.ok ? sem.erro : "", /informe o horário/);

  assert.ok((await atualizarTratamento(db, "ana", t.id, { horario: "08:00", lembrete: true })).ok);
  assert.ok((await atualizarTratamento(db, "ana", t.id, { lembreteDetalhado: true })).ok);
  const ligado = (await carregarTratamento(db, "ana", t.id, SP, agora))!.tratamento;
  assert.deepEqual([ligado.horario, ligado.lembrete, ligado.lembreteDetalhado], ["08:00", true, true]);

  // desligar o lembrete desliga também o texto detalhado
  assert.ok((await atualizarTratamento(db, "ana", t.id, { lembrete: false })).ok);
  const desligado = (await carregarTratamento(db, "ana", t.id, SP, agora))!.tratamento;
  assert.deepEqual([desligado.lembrete, desligado.lembreteDetalhado], [false, false]);
});

test("arquivar para o lembrete e bloqueia novos registros, mas preserva o histórico", async () => {
  const { mem, db } = cenario();
  const t = await comTratamento(db, "ana", { horario: "08:00" });
  await atualizarTratamento(db, "ana", t.id, { lembrete: true });
  await registrarTomada(db, "ana", t.id, { estado: "tomou" }, SP, agora);
  assert.ok((await arquivarTratamento(db, "ana", t.id, true, agora)).ok);
  assert.equal(mem.tratamento.linhas[0].lembrete, false);
  assert.equal((await registrarTomada(db, "ana", t.id, { estado: "tomou", dia: "2026-10-10" }, SP, agora)).ok, false);
  assert.equal(mem.tomadaDia.linhas.length, 1);
});

test("apagar o tratamento apaga TUDO que pende dele — e só dele", async () => {
  const { mem, db } = cenario();
  const a = await comTratamento(db, "ana", { dose: { descricao: "15 mg" } });
  const b = await comTratamento(db, "bia", { dose: { descricao: "10 mg" } });
  await registrarTomada(db, "ana", a.id, { estado: "tomou" }, SP, agora);
  await registrarEfeito(db, "ana", a.id, { descricao: "enjoo" }, SP, agora);
  await registrarTomada(db, "bia", b.id, { estado: "tomou" }, SP, agora);

  assert.ok((await excluirTratamento(db, "ana", a.id)).ok);
  assert.deepEqual([mem.tratamento.linhas.length, mem.doseTratamento.linhas.length, mem.tomadaDia.linhas.length, mem.efeitoRegistrado.linhas.length], [1, 1, 1, 0]);
  assert.equal(mem.tratamento.linhas[0].userId, "bia");
});

test("carregar devolve os quatro números, os cartões do tema e o resumo para a consulta", async () => {
  const { db } = cenario();
  const t = await comTratamento(db, "ana", { dose: { descricao: "15 mg", mg: 15, desde: "2026-10-08" }, horario: "08:00" });
  for (let d = 2; d <= 11; d++) await registrarTomada(db, "ana", t.id, { estado: "tomou", dia: `2026-10-${String(d).padStart(2, "0")}` }, SP, agora);
  const r = (await carregarTratamento(db, "ana", t.id, SP, agora))!;

  assert.equal(r.resumo.desdeInicio.completos, 30);
  assert.equal(r.resumo.doseAtual?.contagem.completos, 3);
  assert.equal(r.resumo.sequenciaConfirmada, 31, "do início até ontem, mais hoje marcado");
  assert.equal(r.resumo.totalRegistrados, 10);
  assert.equal(r.tema?.id, "escitalopram");
  const dez = r.cartoes.find((c) => c.marco.limiar === 10);
  assert.equal(dez?.estado, "sustentado");
  assert.equal(dez?.estado === "sustentado" && dez.titulo, "10 dias seguidos sem esquecer");
  assert.match(r.resumoParaConsulta, /Dose atual informada: 15 mg/);
  assert.match(r.resumoParaConsulta, /Horário previsto informado: 08:00/);
});

test("medicamento 'outro' não ganha cartões nem conteúdo de saúde do escitalopram", async () => {
  const { db } = cenario();
  const t = await criarTratamento(db, "ana", { nome: "paracetamol", inicio: "2026-09-11" }, SP, agora);
  const r = (await carregarTratamento(db, "ana", t.ok ? t.valor.id : "", SP, agora))!;
  assert.equal(r.tema, null);
  assert.deepEqual(r.cartoes, []);
});

/* ---------------------------------- humor --------------------------------- */

test("humor: um registro por dia; registrar de novo EDITA, e apagar volta a 'sem registro'", async () => {
  const { mem, dbHumor } = cenario();
  assert.ok((await registrarHumor(dbHumor, "ana", { humor: 3, energia: 2 }, SP, agora)).ok);
  assert.ok((await registrarHumor(dbHumor, "ana", { humor: 4, nota: "melhor à tarde" }, SP, agora)).ok);
  assert.equal(mem.registroHumor.linhas.length, 1);
  assert.deepEqual([mem.registroHumor.linhas[0].humor, mem.registroHumor.linhas[0].nota], [4, "melhor à tarde"]);
  assert.equal((await registrarHumor(dbHumor, "ana", { humor: 9 }, SP, agora)).ok, false);
  assert.equal((await registrarHumor(dbHumor, "ana", { humor: 3, dia: "2026-10-12" }, SP, agora)).ok, false);

  assert.ok((await removerHumor(dbHumor, "ana", "2026-10-11")).ok);
  assert.equal((await listarHumor(dbHumor, "ana")).length, 0);
});

test("humor: cada pessoa só vê e só apaga o próprio registro", async () => {
  const { mem, dbHumor } = cenario();
  await registrarHumor(dbHumor, "ana", { humor: 2, nota: "privado" }, SP, agora);
  await registrarHumor(dbHumor, "bia", { humor: 5 }, SP, agora);
  assert.deepEqual((await listarHumor(dbHumor, "bia")).map((h) => h.humor), [5]);
  assert.equal((await removerHumor(dbHumor, "bia", "2026-10-10")).ok, false);
  // bia apaga o dia de HOJE dela: não pode levar o da ana junto
  assert.ok((await removerHumor(dbHumor, "bia", "2026-10-11")).ok);
  assert.equal(mem.registroHumor.linhas.length, 1);
  assert.equal(mem.registroHumor.linhas[0].userId, "ana");
});
