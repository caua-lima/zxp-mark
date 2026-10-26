import { test } from "node:test";
import assert from "node:assert/strict";
import {
  diasComRegistro,
  diasRegistrados,
  diasDesdeUltimoRegistro,
  duracaoMs,
  formatarDuracao,
  interpretarSono,
  registroSobreposto,
  resumirSono,
  sugestaoDeHorarios,
} from "./sono.ts";
import { HORA_MS, instanteLocal } from "./datas.ts";

const SP = "America/Sao_Paulo";
const agora = instanteLocal("2026-10-26T10:00", SP)!;
const em = (t: string) => instanteLocal(t, SP)!;

function ok(dormiu: string, acordou: string, qualidade = 3, nota?: string) {
  const r = interpretarSono({ dormiuEm: dormiu, acordouEm: acordou, qualidade, nota }, SP, agora);
  assert.ok(r.ok, r.ok ? "" : r.erro);
  return r.valor;
}
const erro = (dormiu: string, acordou: string, qualidade = 3, nota?: string) => {
  const r = interpretarSono({ dormiuEm: dormiu, acordouEm: acordou, qualidade, nota }, SP, agora);
  assert.equal(r.ok, false);
  return r.ok ? "" : r.erro;
};

test("sono que atravessa a meia-noite tem a duração certa", () => {
  const s = ok("2026-10-25T23:30", "2026-10-26T07:00");
  assert.equal(duracaoMs(s), 7.5 * HORA_MS);
  assert.equal(formatarDuracao(duracaoMs(s)), "7h 30min");
});

test("o relógio digitado é do fuso do usuário, guardado em UTC", () => {
  const s = ok("2026-10-25T23:00", "2026-10-26T07:00");
  assert.equal(s.dormiuEm.toISOString(), "2026-10-26T02:00:00.000Z");
  assert.equal(s.acordouEm.toISOString(), "2026-10-26T10:00:00.000Z");
});

test("sono durante o dia (cochilo) é aceito", () => {
  const s = ok("2026-10-25T14:00", "2026-10-25T15:30", 4);
  assert.equal(duracaoMs(s), 1.5 * HORA_MS);
  assert.equal(s.dormiuEm.toISOString(), "2026-10-25T17:00:00.000Z");
});

test("intervalo invertido é recusado com uma mensagem que diz o que fazer", () => {
  assert.match(erro("2026-10-26T07:00", "2026-10-25T23:00"), /acordou antes de dormir/);
  assert.match(erro("2026-10-26T07:00", "2026-10-26T07:00"), /acordou antes de dormir/);
});

test("recusa duração absurda, muito curta e horário futuro", () => {
  assert.match(erro("2026-10-24T07:00", "2026-10-26T07:00"), /24 horas/);
  assert.match(erro("2026-10-26T07:00", "2026-10-26T07:03"), /curto/);
  assert.match(erro("2026-10-26T08:00", "2026-10-26T12:00"), /ainda não chegou/);
});

test("recusa data inexistente e qualidade fora de 1 a 5", () => {
  assert.match(erro("2026-02-30T23:00", "2026-03-01T07:00"), /Confira a data/);
  assert.match(erro("", "2026-10-26T07:00"), /Confira a data/);
  assert.match(erro("2026-10-25T23:00", "2026-10-26T07:00", 0), /1 a 5/);
  assert.match(erro("2026-10-25T23:00", "2026-10-26T07:00", 6), /1 a 5/);
  assert.match(erro("2026-10-25T23:00", "2026-10-26T07:00", 3.5), /1 a 5/);
});

test("observação em branco vira null e o limite é respeitado", () => {
  assert.equal(ok("2026-10-25T23:00", "2026-10-26T07:00", 3, "   ").nota, null);
  assert.equal(ok("2026-10-25T23:00", "2026-10-26T07:00", 3, " acordei 2x ").nota, "acordei 2x");
  assert.match(erro("2026-10-25T23:00", "2026-10-26T07:00", 3, "x".repeat(501)), /500/);
});

test("sobreposição: invade, contém, e encostar não conta", () => {
  const existente = { id: "a", dormiuEm: em("2026-10-25T23:00"), acordouEm: em("2026-10-26T07:00") };

  const invade = { dormiuEm: em("2026-10-26T06:00"), acordouEm: em("2026-10-26T08:00") };
  assert.equal(registroSobreposto(invade, [existente])?.id, "a");

  const contem = { dormiuEm: em("2026-10-25T22:00"), acordouEm: em("2026-10-26T09:00") };
  assert.equal(registroSobreposto(contem, [existente])?.id, "a");

  const dentro = { dormiuEm: em("2026-10-26T01:00"), acordouEm: em("2026-10-26T02:00") };
  assert.equal(registroSobreposto(dentro, [existente])?.id, "a");

  const encosta = { dormiuEm: em("2026-10-26T07:00"), acordouEm: em("2026-10-26T07:30") };
  assert.equal(registroSobreposto(encosta, [existente]), null);

  const antes = { dormiuEm: em("2026-10-25T20:00"), acordouEm: em("2026-10-25T23:00") };
  assert.equal(registroSobreposto(antes, [existente]), null);
});

test("editar um registro não colide com ele mesmo", () => {
  const existente = { id: "a", dormiuEm: em("2026-10-25T23:00"), acordouEm: em("2026-10-26T07:00") };
  const editado = { dormiuEm: em("2026-10-25T23:30"), acordouEm: em("2026-10-26T07:30") };
  assert.equal(registroSobreposto(editado, [existente], "a"), null);
  assert.equal(registroSobreposto(editado, [existente])?.id, "a");
});

test("média e contagem ignoram os dias sem registro — sem registro não é zero hora", () => {
  // hoje é 26/out. Registros nas noites de 24, 25 e 26: 8h cada.
  const registros = [
    { dormiuEm: em("2026-10-23T23:00"), acordouEm: em("2026-10-24T07:00"), qualidade: 4 },
    { dormiuEm: em("2026-10-24T23:00"), acordouEm: em("2026-10-25T07:00"), qualidade: 3 },
    { dormiuEm: em("2026-10-25T23:00"), acordouEm: em("2026-10-26T07:00"), qualidade: 5 },
  ];
  const r = resumirSono(registros, SP, agora);

  assert.equal(r.dias.length, 7);
  assert.equal(r.dias[6].dia, "2026-10-26");
  assert.equal(r.dias[0].dia, "2026-10-20");
  assert.equal(r.noitesRegistradas, 3);
  assert.equal(r.mediaMs, 8 * HORA_MS); // e não 3 × 8h ÷ 7
  assert.equal(r.qualidadeMedia, 4);
  // os 4 dias sem dado são null, nunca 0
  assert.equal(r.dias.filter((d) => d.totalMs === null).length, 4);
  assert.ok(r.dias.every((d) => d.totalMs === null || d.totalMs > 0));
});

test("sem nenhum registro: média nula, não zero", () => {
  const r = resumirSono([], SP, agora);
  assert.equal(r.mediaMs, null);
  assert.equal(r.qualidadeMedia, null);
  assert.equal(r.noitesRegistradas, 0);
  assert.equal(r.dias.length, 7);
});

test("cochilo no mesmo dia soma na data em que se acordou", () => {
  const registros = [
    { dormiuEm: em("2026-10-25T23:00"), acordouEm: em("2026-10-26T06:00"), qualidade: 4 },
    { dormiuEm: em("2026-10-26T08:00"), acordouEm: em("2026-10-26T09:00"), qualidade: 2 },
  ];
  const r = resumirSono(registros, SP, agora);
  const hoje = r.dias[6];
  assert.equal(hoje.registros, 2);
  assert.equal(hoje.totalMs, 8 * HORA_MS);
  assert.equal(r.noitesRegistradas, 1);
});

test("registros fora da janela de 7 dias não entram no gráfico", () => {
  const velho = { dormiuEm: em("2026-10-01T23:00"), acordouEm: em("2026-10-02T07:00"), qualidade: 3 };
  const r = resumirSono([velho], SP, agora);
  assert.equal(r.noitesRegistradas, 0);
  assert.equal(r.mediaMs, null);
});

test("a janela é por dia de calendário local, não por blocos de 24h", () => {
  // 00:30 de hoje em SP ainda é "hoje" mesmo que em UTC já fosse outro dia
  const tarde = em("2026-10-26T00:30");
  const r = resumirSono([], SP, tarde);
  assert.equal(r.dias[6].dia, "2026-10-26");
});

test("a progressão conta dias distintos, e uma pausa não apaga nada", () => {
  const registros = [
    { acordouEm: em("2026-09-01T07:00") },
    { acordouEm: em("2026-09-02T07:00") },
    { acordouEm: em("2026-09-02T14:00") }, // mesmo dia: não conta de novo
    { acordouEm: em("2026-10-20T07:00") }, // depois de semanas sem registrar
  ];
  assert.equal(diasComRegistro(registros, SP), 3);
  assert.equal(diasDesdeUltimoRegistro(registros, SP, agora), 6);
  assert.equal(diasDesdeUltimoRegistro([], SP, agora), null);
});

test("sugestão do formulário: ontem 23:00 até hoje 07:00, no fuso certo", () => {
  assert.deepEqual(sugestaoDeHorarios(SP, agora), {
    dormiuEm: "2026-10-25T23:00",
    acordouEm: "2026-10-26T07:00",
  });
  // 01:30 UTC de 26/out ainda é noite de 25 em São Paulo
  const madrugadaUtc = new Date("2026-10-26T01:30:00Z");
  assert.equal(sugestaoDeHorarios(SP, madrugadaUtc).acordouEm, "2026-10-25T07:00");
});

test("formatarDuracao", () => {
  assert.equal(formatarDuracao(45 * 60_000), "45min");
  assert.equal(formatarDuracao(8 * HORA_MS), "8h");
  assert.equal(formatarDuracao(6.25 * HORA_MS), "6h 15min");
  assert.equal(formatarDuracao(-5), "0min");
});

test("diasRegistrados: dias distintos em ordem; o n-ésimo é o dia de 'n noites registradas'", () => {
  const registros = [
    { acordouEm: em("2026-10-20T07:00") },
    { acordouEm: em("2026-10-02T07:00") },
    { acordouEm: em("2026-10-20T14:00") }, // mesmo dia do primeiro: não conta de novo
    { acordouEm: em("2026-10-10T07:00") },
  ];
  assert.deepEqual(diasRegistrados(registros, SP), ["2026-10-02", "2026-10-10", "2026-10-20"]);
  assert.equal(diasRegistrados(registros, SP).length, diasComRegistro(registros, SP));
  assert.deepEqual(diasRegistrados([], SP), []);
  // o fuso decide o dia: 01:30 UTC de 26/out ainda é 25/out em São Paulo
  assert.deepEqual(diasRegistrados([{ acordouEm: new Date("2026-10-26T01:30:00Z") }], SP), ["2026-10-25"]);
});
