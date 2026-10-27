import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contextoMaisFrequente,
  estadoDoDia,
  estrategiasUsadas,
  frequenciaSemanal,
  resumir,
  situacaoDosMarcos,
  somarDias,
  validarEvento,
  type EventoRegistro,
} from "./episodios.ts";
import { unhas } from "../conhecimento/temas/unhas.ts";
import { instanteLocal } from "../datas.ts";

const SP = "America/Sao_Paulo";
const INICIO = "2026-10-01";
const agora = instanteLocal("2026-10-11T10:00", SP)!.getTime(); // hoje = 2026-10-11

const dias = (de: string, ate: string) => {
  const l: string[] = [];
  for (let d = de; d <= ate; d = somarDias(d, 1)) l.push(d);
  return l;
};
const conf = (lista: string[]): EventoRegistro[] => lista.map((dia) => ({ tipo: "dia_sem", dia }));
const epi = (dia: string, extra: Partial<EventoRegistro> = {}): EventoRegistro => ({ tipo: "episodio", dia, ...extra });
const resumo = (ev: EventoRegistro[], inicio = INICIO) => resumir(ev, inicio, agora, SP);
const sit = (ev: EventoRegistro[], limiar: number) =>
  situacaoDosMarcos(unhas.marcos, resumo(ev)).find((s) => s.marco.limiar === limiar)!;

test("10 dias consecutivos CONFIRMADOS sustentam o marco forte, com o texto do briefing", () => {
  const r = resumo(conf(dias("2026-10-02", "2026-10-11")));
  assert.equal(r.sequenciaConfirmada, 10);
  assert.equal(r.inicioDaSequencia, "2026-10-02");
  const s = sit(conf(dias("2026-10-02", "2026-10-11")), 10);
  assert.equal(s.estado, "sustentado");
  if (s.estado === "sustentado") {
    assert.equal(s.titulo, "10 dias sem roer, conforme seus registros");
    assert.match(s.texto, /O que você percebeu até aqui\?/);
  }
});

test("passou o tempo mas faltam confirmações → título FRACO, que diz quantos dias estão sem informação", () => {
  const ev = conf(dias("2026-10-01", "2026-10-11").filter((d) => d !== "2026-10-06"));
  const r = resumo(ev);
  assert.equal(r.sequenciaConfirmada, 5); // 07..11
  assert.equal(r.diasSemInformacao, 1);
  const s = sit(ev, 10);
  assert.equal(s.estado, "so-tempo");
  if (s.estado === "so-tempo") {
    assert.equal(s.titulo, "10 dias desde o início informado");
    assert.equal(s.diasSemInformacao, 1);
    assert.doesNotMatch(s.titulo, /sem roer/);
  }
});

test("FALTA DE REGISTRO NÃO COMPROVA AUSÊNCIA: 10 dias sem nenhum registro não viram '10 dias sem roer'", () => {
  const r = resumo([]);
  assert.equal(r.sequenciaConfirmada, 0);
  assert.equal(r.diasSemInformacao, 10); // 01..10 (hoje ainda pode ser marcado)
  for (const limiar of [1, 3, 7, 10]) {
    const s = sit([], limiar);
    assert.notEqual(s.estado, "sustentado", `${limiar}d`);
  }
  assert.equal(sit([], 14).estado, "futuro");
});

test("um episódio recomeça a sequência, mas não apaga nada do histórico", () => {
  const ev = [...conf(dias("2026-10-01", "2026-10-08")), epi("2026-10-09"), ...conf(["2026-10-10", "2026-10-11"])];
  const r = resumo(ev);
  assert.equal(r.ultimoEpisodio, "2026-10-09");
  assert.equal(r.referencia, "episodio");
  assert.equal(r.diasDesdeReferencia, 2);
  assert.equal(r.sequenciaConfirmada, 2);
  assert.equal(r.totalEpisodios, 1);
  assert.equal(r.totalDiasConfirmados, 10, "os 8 dias anteriores + 2 depois continuam contados");
  assert.equal(sit(ev, 1).estado, "sustentado");
  assert.equal(sit(ev, 3).estado, "futuro");
});

test("se o episódio e a confirmação são do mesmo dia, o episódio vence", () => {
  const ev: EventoRegistro[] = [{ tipo: "dia_sem", dia: "2026-10-11" }, epi("2026-10-11")];
  assert.equal(estadoDoDia(ev, "2026-10-11"), "episodio");
  assert.equal(resumo(ev).sequenciaConfirmada, 0);
});

test("hoje ainda não marcado não quebra a sequência: conta até ontem", () => {
  const ev = conf(dias("2026-10-04", "2026-10-10"));
  const r = resumo(ev);
  assert.equal(r.sequenciaConfirmada, 7);
  assert.equal(r.inicioDaSequencia, "2026-10-04");
});

test("um dia sem informação no meio QUEBRA a sequência — e preencher depois a restaura", () => {
  const sem6 = conf(dias("2026-10-02", "2026-10-11").filter((d) => d !== "2026-10-06"));
  assert.equal(resumo(sem6).sequenciaConfirmada, 5);
  assert.equal(sit(sem6, 10).estado, "so-tempo");
  // a pessoa lembra e preenche o dia 6
  const completo = [...sem6, ...conf(["2026-10-06"])];
  assert.equal(resumo(completo).sequenciaConfirmada, 10);
  assert.equal(sit(completo, 10).estado, "sustentado");
});

test("registro duplicado do mesmo dia não infla nada", () => {
  const ev = [...conf(["2026-10-10", "2026-10-11"]), ...conf(["2026-10-11"]), ...conf(["2026-10-10"])];
  const r = resumo(ev);
  assert.equal(r.sequenciaConfirmada, 2);
  assert.equal(r.totalDiasConfirmados, 2);
});

test("dias anteriores ao início do acompanhamento não existem", () => {
  const ev = conf(dias("2026-09-20", "2026-10-11"));
  const r = resumo(ev, "2026-10-05");
  assert.equal(r.sequenciaConfirmada, 7); // 05..11
  assert.equal(r.inicioDaSequencia, "2026-10-05");
});

test("o dia de hoje vem do fuso do usuário, não do servidor", () => {
  // 01:30 UTC de 12/out ainda é 11/out em São Paulo, mas já é 12/out em Tóquio
  const instante = new Date("2026-10-12T01:30:00Z").getTime();
  assert.equal(resumir([], INICIO, instante, SP).hoje, "2026-10-11");
  assert.equal(resumir([], INICIO, instante, "Asia/Tokyo").hoje, "2026-10-12");
});

test("frequência semanal avisa quantos dias estavam sem informação em cada semana", () => {
  const ev = [epi("2026-10-09"), ...conf(["2026-10-10", "2026-10-11"]), epi("2026-10-03", { contexto: "tedio" })];
  const s = frequenciaSemanal(ev, INICIO, agora, SP, 2);
  assert.equal(s.length, 2);
  const nova = s[1]; // 05..11
  assert.equal(nova.ate, "2026-10-11");
  assert.equal(nova.de, "2026-10-05");
  assert.equal(nova.episodios, 1);
  assert.equal(nova.diasConfirmados, 2);
  assert.equal(nova.diasSemInformacao, 4); // 05,06,07,08 (09 teve episódio; hoje não conta)
  const antiga = s[0]; // 28/set..04/out; antes do início não existe
  assert.equal(antiga.episodios, 1);
  assert.equal(antiga.diasConfirmados, 0);
  assert.equal(antiga.diasSemInformacao, 3); // 01, 02, 04 (03 teve episódio)
});

test("contexto mais frequente e estratégias usadas vêm dos registros, e nada é inventado", () => {
  assert.equal(contextoMaisFrequente([]), null);
  const ev: EventoRegistro[] = [
    epi("2026-10-02", { contexto: "tedio", estrategia: "bolinha" }),
    { tipo: "vontade", dia: "2026-10-03", contexto: "tedio", estrategia: "bolinha" },
    { tipo: "vontade", dia: "2026-10-04", contexto: "trabalho", estrategia: "respirar" },
    { tipo: "dia_sem", dia: "2026-10-05", contexto: "estudo" }, // confirmação não conta como gatilho
  ];
  assert.deepEqual(contextoMaisFrequente(ev), { contexto: "tedio", vezes: 2 });
  assert.deepEqual(estrategiasUsadas(ev), [
    { estrategia: "bolinha", vezes: 2 },
    { estrategia: "respirar", vezes: 1 },
  ]);
});

/* ------------------------------- validação ------------------------------- */

const valida = (e: Parameters<typeof validarEvento>[0], inicio = INICIO) => validarEvento(e, inicio, agora, SP);
const erro = (e: Parameters<typeof validarEvento>[0], inicio = INICIO) => {
  const r = valida(e, inicio);
  assert.equal(r.ok, false);
  return r.ok ? "" : r.erro;
};

test("registro sem data vale hoje, no instante real; com dia passado vale o meio-dia local", () => {
  const hoje = valida({ tipo: "dia_sem" });
  assert.ok(hoje.ok);
  assert.equal(hoje.ok && hoje.valor.dia, "2026-10-11");
  assert.equal(hoje.ok && hoje.valor.quando.getTime(), agora);

  const passado = valida({ tipo: "episodio", dia: "2026-10-08" });
  assert.ok(passado.ok);
  assert.equal(passado.ok && passado.valor.quando.toISOString(), "2026-10-08T15:00:00.000Z"); // 12:00 em São Paulo
});

test("recusa dia futuro, dia antes do início, data impossível e tipo inexistente", () => {
  assert.match(erro({ tipo: "episodio", dia: "2026-10-12" }), /ainda não chegou/);
  assert.match(erro({ tipo: "episodio", dia: "2026-09-30" }), /anterior ao início/);
  assert.match(erro({ tipo: "episodio", dia: "2026-02-30" }), /data válida/);
  assert.match(erro({ tipo: "tomou" }), /não existe/);
  assert.match(erro({ tipo: "pratica" }), /não existe/); // não permitido para este acompanhamento
});

test("escalas de 1 a 5, contexto da lista, nota curta e quantidade só em prática", () => {
  assert.match(erro({ tipo: "vontade", intensidade: 6 }), /1 a 5/);
  assert.match(erro({ tipo: "vontade", intensidade: 0 }), /1 a 5/);
  assert.match(erro({ tipo: "episodio", desconforto: 2.5 }), /1 a 5/);
  assert.match(erro({ tipo: "episodio", contexto: "festa" }), /contexto da lista/);
  assert.match(erro({ tipo: "episodio", nota: "x".repeat(301) }), /300/);
  assert.match(erro({ tipo: "episodio", valor: 10 }), /Só registros de prática/);
  const ok = valida({ tipo: "episodio", intensidade: 4, contexto: "trabalho", estrategia: "  bolinha ", desconforto: 2, aparencia: 3, nota: " ok " });
  assert.ok(ok.ok);
  assert.deepEqual(ok.ok && [ok.valor.contexto, ok.valor.estrategia, ok.valor.nota], ["trabalho", "bolinha", "ok"]);
});

test("a prática aceita quantidade, dentro do limite", () => {
  const r = validarEvento({ tipo: "pratica", valor: 30 }, INICIO, agora, SP, ["pratica"]);
  assert.ok(r.ok);
  assert.equal(r.ok && r.valor.valor, 30);
  const longe = validarEvento({ tipo: "pratica", valor: 5000 }, INICIO, agora, SP, ["pratica"]);
  assert.equal(longe.ok, false);
});
