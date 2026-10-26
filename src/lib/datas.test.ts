import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deslocamentoMs,
  diaCalendario,
  diaLocalDe,
  diasCompletos,
  diferencaDias,
  estadoRegressiva,
  fusoSeguro,
  fusoValido,
  instanteLocal,
  textoLocal,
  HORA_MS,
} from "./datas.ts";

const SP = "America/Sao_Paulo";
const iso = (d: Date | null) => d?.toISOString() ?? null;

test("instanteLocal interpreta o relógio de parede no fuso do usuário, não no do servidor", () => {
  // São Paulo é UTC-3 o ano todo desde 2019
  assert.equal(iso(instanteLocal("2026-11-13T09:00", SP)), "2026-11-13T12:00:00.000Z");
  assert.equal(iso(instanteLocal("2026-11-13T09:00", "UTC")), "2026-11-13T09:00:00.000Z");
  assert.equal(iso(instanteLocal("2026-11-13T09:00", "Asia/Tokyo")), "2026-11-13T00:00:00.000Z");
});

test("instanteLocal sem hora vale meia-noite local", () => {
  assert.equal(iso(instanteLocal("2026-11-13", SP)), "2026-11-13T03:00:00.000Z");
});

test("instanteLocal recusa datas que não existem", () => {
  assert.equal(instanteLocal("2026-02-30T10:00", SP), null);
  assert.equal(instanteLocal("2026-13-01T10:00", SP), null);
  assert.equal(instanteLocal("2026-11-13T25:00", SP), null);
  assert.equal(instanteLocal("ontem", SP), null);
  assert.equal(instanteLocal("", SP), null);
});

test("instanteLocal recusa o horário que o relógio pulou na troca de horário de verão", () => {
  // Nova York, 8/mar/2026: às 02:00 o relógio salta para 03:00
  assert.equal(instanteLocal("2026-03-08T02:30", "America/New_York"), null);
  assert.notEqual(instanteLocal("2026-03-08T03:30", "America/New_York"), null);
});

test("deslocamento acompanha o horário de verão", () => {
  const inverno = Date.UTC(2026, 0, 15, 12);
  const verao = Date.UTC(2026, 6, 15, 12);
  assert.equal(deslocamentoMs("America/New_York", inverno), -5 * HORA_MS);
  assert.equal(deslocamentoMs("America/New_York", verao), -4 * HORA_MS);
});

test("textoLocal e instanteLocal são inversos", () => {
  const original = "2026-10-26T23:47";
  for (const tz of [SP, "UTC", "Asia/Tokyo", "America/New_York"]) {
    const instante = instanteLocal(original, tz);
    assert.ok(instante, tz);
    assert.equal(textoLocal(instante, tz), original, tz);
  }
});

test("o mesmo instante cai em dias diferentes conforme o fuso", () => {
  const instante = new Date("2026-10-26T01:30:00Z");
  assert.equal(diaLocalDe(instante, "UTC"), "2026-10-26");
  assert.equal(diaLocalDe(instante, SP), "2026-10-25"); // ainda é noite em São Paulo
  assert.equal(diaLocalDe(instante, "Asia/Tokyo"), "2026-10-26");
});

test("meia-noite local é 00:00, nunca 24:00", () => {
  const meiaNoite = instanteLocal("2026-10-26T00:00", SP)!;
  assert.equal(textoLocal(meiaNoite, SP), "2026-10-26T00:00");
});

test("diferencaDias cruza mês e ano", () => {
  assert.equal(diferencaDias("2026-10-26", "2026-10-26"), 0);
  assert.equal(diferencaDias("2026-10-30", "2026-11-02"), 3);
  assert.equal(diferencaDias("2026-12-31", "2027-01-01"), 1);
  assert.equal(diferencaDias("2026-10-26", "2026-10-25"), -1);
});

test("'dia 1' não é '1 dia completo': duas horas depois de começar já é o dia 2", () => {
  const inicio = instanteLocal("2026-10-01T22:00", SP)!;
  const depoisDaMeiaNoite = instanteLocal("2026-10-02T00:05", SP)!;
  assert.equal(diasCompletos(inicio, depoisDaMeiaNoite), 0);
  assert.equal(diaCalendario(inicio, inicio, SP), 1);
  assert.equal(diaCalendario(inicio, depoisDaMeiaNoite, SP), 2);

  const vinteQuatroHoras = instanteLocal("2026-10-02T22:00", SP)!;
  assert.equal(diasCompletos(inicio, vinteQuatroHoras), 1);
  const umMinutoAntes = new Date(vinteQuatroHoras.getTime() - 60_000);
  assert.equal(diasCompletos(inicio, umMinutoAntes), 0);
});

test("início sem hora: dia completo e dia do calendário viram juntos à meia-noite", () => {
  const inicio = instanteLocal("2026-10-01", SP)!;
  assert.equal(diasCompletos(inicio, instanteLocal("2026-10-01T23:59", SP)!), 0);
  assert.equal(diaCalendario(inicio, instanteLocal("2026-10-01T23:59", SP)!, SP), 1);
  assert.equal(diasCompletos(inicio, instanteLocal("2026-10-02T00:00", SP)!), 1);
  assert.equal(diaCalendario(inicio, instanteLocal("2026-10-02T00:00", SP)!, SP), 2);
});

test("início no futuro nunca gera número negativo", () => {
  const inicio = instanteLocal("2026-12-01T10:00", SP)!;
  const agora = instanteLocal("2026-10-26T10:00", SP)!;
  assert.equal(diasCompletos(inicio, agora), 0);
  assert.equal(diaCalendario(inicio, agora, SP), 1);
});

test("regressiva: futura, hoje e concluída, sem negativos", () => {
  const alvo = instanteLocal("2026-11-13T09:00", SP)!;

  const longe = estadoRegressiva(alvo, instanteLocal("2026-10-20T09:00", SP)!, SP);
  assert.equal(longe.tipo, "futura");
  assert.equal(longe.dias, 24);

  const umDiaEMeio = estadoRegressiva(alvo, instanteLocal("2026-11-11T21:00", SP)!, SP);
  assert.equal(umDiaEMeio.tipo, "futura");
  assert.equal(umDiaEMeio.dias, 1);

  const minutosAntes = estadoRegressiva(alvo, instanteLocal("2026-11-13T08:30", SP)!, SP);
  assert.equal(minutosAntes.tipo, "futura");
  assert.equal(minutosAntes.dias, 0);

  const noInstante = estadoRegressiva(alvo, alvo, SP);
  assert.equal(noInstante.tipo, "hoje");

  const mesmaNoite = estadoRegressiva(alvo, instanteLocal("2026-11-13T23:59", SP)!, SP);
  assert.equal(mesmaNoite.tipo, "hoje");

  const diaSeguinte = estadoRegressiva(alvo, instanteLocal("2026-11-14T00:00", SP)!, SP);
  assert.deepEqual(diaSeguinte, { tipo: "concluida", dias: 1 });

  const mesesDepois = estadoRegressiva(alvo, instanteLocal("2027-02-13T10:00", SP)!, SP);
  assert.equal(mesesDepois.tipo, "concluida");
  assert.equal(mesesDepois.dias, 92);
});

test("fusoValido / fusoSeguro", () => {
  assert.equal(fusoValido("America/Sao_Paulo"), true);
  assert.equal(fusoValido("Marte/Olympus"), false);
  assert.equal(fusoSeguro("Marte/Olympus"), SP);
  assert.equal(fusoSeguro(""), SP);
  assert.equal(fusoSeguro(null), SP);
  assert.equal(fusoSeguro("Asia/Tokyo"), "Asia/Tokyo");
});
