import { test } from "node:test";
import assert from "node:assert/strict";
import {
  doseVigente,
  identificarMedicamento,
  montarResumoParaConsulta,
  resumirTratamento,
  situacaoDosCartoes,
  validarDose,
  validarEfeito,
  validarHorario,
  validarTomada,
  type DoseRegistro,
  type TomadaRegistro,
} from "./medicamento.ts";
import { somarDias } from "./episodios.ts";
import { instanteLocal } from "../datas.ts";
import { escitalopram } from "../conhecimento/temas/escitalopram.ts";
import { TEMAS } from "../conhecimento/catalogo.ts";

const SP = "America/Sao_Paulo";
const agora = instanteLocal("2026-10-11T10:00", SP)!.getTime(); // hoje = 2026-10-11
// Valores de TESTE, só aqui: nada disto é conteúdo do app nem de nenhum usuário real.
const INICIO = instanteLocal("2026-09-11T08:00", SP)!; // tratamento há 30 dias
const DOSE_NOVA = instanteLocal("2026-10-08", SP)!; // dose atual há 3 dias

const dias = (de: string, ate: string) => {
  const l: string[] = [];
  for (let d = de; d <= ate; d = somarDias(d, 1)) l.push(d);
  return l;
};
const tomou = (lista: string[]): TomadaRegistro[] => lista.map((dia) => ({ dia, estado: "tomou" }));
const resumo = (t: TomadaRegistro[], d: DoseRegistro[] = [], inicio: Date = INICIO) => resumirTratamento(inicio, d, t, agora, SP);

/* ------------------- os quatro números nunca se misturam ------------------ */

test("tratamento há um mês e dose há 3 dias: são DUAS contagens, e a mudança de dose não reinicia nada", () => {
  const doses: DoseRegistro[] = [
    { descricao: "10 mg", mg: 10, desde: INICIO },
    { descricao: "20 mg", mg: 20, desde: DOSE_NOVA },
  ];
  const r = resumo(tomou(dias("2026-09-11", "2026-10-11")), doses);

  assert.equal(r.desdeInicio.completos, 30);
  assert.equal(r.doseAtual?.descricao, "20 mg");
  assert.equal(r.doseAtual?.contagem.completos, 3);
  assert.equal(r.doseAtual?.desdeDia, "2026-10-08");
  // a sequência e o total vêm dos REGISTROS, e continuam intactos:
  assert.equal(r.sequenciaConfirmada, 31);
  assert.equal(r.totalRegistrados, 31);
});

test("mudar de dose não altera sequência, total, dias sem informação nem os cartões", () => {
  const t = tomou(dias("2026-10-02", "2026-10-11"));
  const semDose = resumo(t, []);
  const comMudanca = resumo(t, [
    { descricao: "10 mg", desde: INICIO },
    { descricao: "20 mg", desde: DOSE_NOVA },
  ]);
  for (const k of ["sequenciaConfirmada", "totalRegistrados", "totalTomou", "diasSemInformacao"] as const) {
    assert.equal(comMudanca[k], semDose[k], k);
  }
  assert.deepEqual(
    situacaoDosCartoes(escitalopram.marcos, semDose).map((s) => s.estado),
    situacaoDosCartoes(escitalopram.marcos, comMudanca).map((s) => s.estado)
  );
});

test("sem nenhuma dose informada, não se presume dose nenhuma", () => {
  const r = resumo(tomou(["2026-10-11"]), []);
  assert.equal(r.doseAtual, null);
});

test("a dose vigente é a de maior 'desde' que JÁ começou; dose futura ainda não vale", () => {
  const doses: DoseRegistro[] = [
    { descricao: "10 mg", desde: INICIO },
    { descricao: "20 mg", desde: DOSE_NOVA },
    { descricao: "5 mg", desde: instanteLocal("2026-10-20", SP)! }, // futura
  ];
  assert.equal(doseVigente(doses, agora)?.descricao, "20 mg");
  assert.equal(doseVigente([], agora), null);
  assert.equal(doseVigente([{ descricao: "5 mg", desde: instanteLocal("2026-10-20", SP)! }], agora), null);
});

/* --------------------------- sequência e lacunas -------------------------- */

test("'esqueci de registrar ontem': a sequência recomeça, mas o total e o tempo desde o início seguem", () => {
  const completo = tomou(dias("2026-10-01", "2026-10-11"));
  assert.equal(resumo(completo).sequenciaConfirmada, 11);

  const semOntem = completo.filter((t) => t.dia !== "2026-10-10");
  const r = resumo(semOntem);
  assert.equal(r.sequenciaConfirmada, 1, "só hoje");
  assert.equal(r.totalRegistrados, 10, "o total registrado não perde nada");
  assert.equal(r.desdeInicio.completos, 30, "o tempo desde o início não depende de registro");
  assert.equal(r.diasSemInformacao >= 1, true);

  // a pessoa lembra e registra ontem: a sequência volta
  assert.equal(resumo([...semOntem, ...tomou(["2026-10-10"])]).sequenciaConfirmada, 11);
});

test("'não tomei' é informação: quebra a sequência mas conta como dia registrado, e não como sem informação", () => {
  const t: TomadaRegistro[] = [...tomou(dias("2026-10-05", "2026-10-09")), { dia: "2026-10-10", estado: "nao_tomou" }, ...tomou(["2026-10-11"])];
  const r = resumo(t);
  assert.equal(r.sequenciaConfirmada, 1);
  assert.equal(r.totalRegistrados, 7);
  assert.equal(r.totalNaoTomou, 1);
  assert.equal(r.totalTomou, 6);
});

test("hoje ainda não registrado não quebra a sequência: conta até ontem", () => {
  const r = resumo(tomou(dias("2026-10-04", "2026-10-10")));
  assert.equal(r.sequenciaConfirmada, 7);
  assert.equal(r.hojeEstado, null);
});

test("registro duplicado do mesmo dia não infla nada (último vale)", () => {
  const r = resumo([...tomou(["2026-10-10", "2026-10-11"]), ...tomou(["2026-10-11"]), { dia: "2026-10-10", estado: "tomou" }]);
  assert.equal(r.sequenciaConfirmada, 2);
  assert.equal(r.totalRegistrados, 2);
});

test("registros fora do período (antes do início ou no futuro) não contam", () => {
  const r = resumo([...tomou(["2026-08-01", "2026-12-25"]), ...tomou(["2026-10-11"])]);
  assert.equal(r.totalRegistrados, 1);
});

test("edição retroativa: trocar 'tomou' por 'não tomou' em um dia recalcula tudo, sem lixo", () => {
  const base = tomou(dias("2026-10-02", "2026-10-11"));
  assert.equal(resumo(base).sequenciaConfirmada, 10);
  const editado = base.map((t) => (t.dia === "2026-10-06" ? { ...t, estado: "nao_tomou" } : t));
  const r = resumo(editado);
  assert.equal(r.sequenciaConfirmada, 5); // 07..11
  assert.equal(r.totalRegistrados, 10);
  assert.equal(r.totalNaoTomou, 1);
  // apagar o registro de um dia o devolve a "sem informação" (não a "não tomou")
  const apagado = base.filter((t) => t.dia !== "2026-10-06");
  const a = resumo(apagado);
  assert.equal(a.totalRegistrados, 9);
  assert.equal(a.totalNaoTomou, 0);
});

test("o dia de hoje e o dia dos registros seguem o fuso do usuário", () => {
  const instante = new Date("2026-10-12T01:30:00Z").getTime(); // 11/out em São Paulo; 12/out em Tóquio
  const sp = resumirTratamento(INICIO, [], [], instante, SP);
  const tk = resumirTratamento(INICIO, [], [], instante, "Asia/Tokyo");
  assert.equal(sp.hoje, "2026-10-11");
  assert.equal(tk.hoje, "2026-10-12");
});

/* ------------------------------- cartões --------------------------------- */

test("10 dias consecutivos confirmados → título forte do briefing; senão, 'desde o início informado'", () => {
  const dezDias = resumirTratamento(instanteLocal("2026-10-02T08:00", SP)!, [], tomou(dias("2026-10-02", "2026-10-11")), agora, SP);
  const forte = situacaoDosCartoes(escitalopram.marcos, dezDias).find((s) => s.marco.limiar === 10)!;
  assert.equal(forte.estado, "sustentado");
  assert.equal(forte.titulo, "10 dias consecutivos com tomada registrada");

  // mesmos 10 dias de calendário, mas com um dia sem informação
  const comLacuna = resumirTratamento(
    instanteLocal("2026-10-01T08:00", SP)!,
    [],
    tomou(dias("2026-10-01", "2026-10-11").filter((d) => d !== "2026-10-05")),
    agora,
    SP
  );
  const fraco = situacaoDosCartoes(escitalopram.marcos, comLacuna).find((s) => s.marco.limiar === 10)!;
  assert.equal(fraco.estado, "so-tempo");
  assert.equal(fraco.titulo, "10 dias desde o início informado");
  assert.equal(fraco.estado === "so-tempo" && fraco.diasSemInformacao, 1);
});

test("sem nenhum registro, nenhum cartão vira título forte, mesmo com meses de tratamento", () => {
  const r = resumo([]);
  assert.equal(r.desdeInicio.completos, 30);
  const s = situacaoDosCartoes(escitalopram.marcos, r);
  assert.ok(s.every((x) => x.estado !== "sustentado"));
  assert.equal(s.find((x) => x.marco.limiar === 30)?.estado, "so-tempo");
  assert.equal(s.find((x) => x.marco.limiar === 42)?.estado, "futuro");
  // futuro: o conteúdo continua legível (não fica trancado por pontuação)
  const futuro = s.find((x) => x.marco.limiar === 60)!;
  assert.ok(futuro.marco.texto.length > 50);
});

test("os cartões 1, 3, 7, 10, 14, 21, 30, 42 e 60 existem, e 42 e 60 ficam 'futuro' no primeiro mês", () => {
  const s = situacaoDosCartoes(escitalopram.marcos, resumo(tomou(dias("2026-09-12", "2026-10-11"))));
  assert.deepEqual(s.map((x) => x.marco.limiar), [1, 3, 7, 10, 14, 21, 30, 42, 60]);
  assert.equal(s.find((x) => x.marco.limiar === 30)?.estado, "sustentado");
  assert.equal(s.find((x) => x.marco.limiar === 42)?.estado, "futuro");
  const f = s.find((x) => x.marco.limiar === 42)!;
  assert.equal(f.estado === "futuro" && f.faltamDias, 12);
});

/* ------------------------------- validação -------------------------------- */

const tomada = (e: Parameters<typeof validarTomada>[0]) => validarTomada(e, INICIO, agora, SP);

test("tomada: hoje por padrão, retroativa dentro do período, e nunca no futuro nem antes do início", () => {
  const hoje = tomada({ estado: "tomou", horario: "08:30" });
  assert.ok(hoje.ok);
  assert.equal(hoje.ok && hoje.valor.dia, "2026-10-11");
  assert.equal(hoje.ok && hoje.valor.horario, "08:30");
  assert.ok(tomada({ estado: "tomou", dia: "2026-10-01" }).ok);
  assert.match(tomada({ estado: "tomou", dia: "2026-10-12" }).ok ? "" : (tomada({ estado: "tomou", dia: "2026-10-12" }) as { erro: string }).erro, /ainda não chegou/);
  const antes = tomada({ estado: "tomou", dia: "2026-08-01" });
  assert.equal(antes.ok, false);
  assert.match(antes.ok ? "" : antes.erro, /anterior ao início informado/);
});

test("tomada: estado inválido, horário inválido e nota longa são recusados; 'não tomei' ignora horário", () => {
  assert.equal(tomada({ estado: "talvez" }).ok, false);
  assert.equal(tomada({ estado: "tomou", horario: "25:99" }).ok, false);
  assert.equal(tomada({ estado: "tomou", nota: "x".repeat(301) }).ok, false);
  const n = tomada({ estado: "nao_tomou", horario: "08:00" });
  assert.ok(n.ok);
  assert.equal(n.ok && n.valor.horario, null);
  assert.equal(validarHorario("08:30").ok, true);
  assert.equal(validarHorario("").ok, true);
  assert.equal(validarHorario("8:30").ok, false);
});

test("dose: informada, nunca avaliada; não pode começar antes do tratamento, nem no futuro", () => {
  const v = (e: Parameters<typeof validarDose>[0]) => validarDose(e, INICIO, agora, SP);
  const ok = v({ descricao: " 20 mg ", mg: 20, desde: "2026-10-08" });
  assert.ok(ok.ok);
  assert.equal(ok.ok && ok.valor.descricao, "20 mg");
  assert.equal(ok.ok && ok.valor.desde.toISOString(), "2026-10-08T03:00:00.000Z");
  // o app não julga a dose: aceita qualquer número positivo plausível, inclusive "menor" ou "maior"
  assert.ok(v({ descricao: "5 mg", mg: 5, desde: "2026-10-08" }).ok);
  assert.ok(v({ descricao: "40 mg", mg: 40, desde: "2026-10-08" }).ok);
  assert.ok(v({ descricao: "meio comprimido", desde: "2026-10-08" }).ok);
  assert.equal(v({ descricao: "", desde: "2026-10-08" }).ok, false);
  assert.equal(v({ descricao: "20 mg", mg: -5, desde: "2026-10-08" }).ok, false);
  const antes = v({ descricao: "10 mg", desde: "2026-09-01" });
  assert.equal(antes.ok, false);
  assert.match(antes.ok ? "" : antes.erro, /não pode começar antes do início informado do tratamento/);
  assert.equal(v({ descricao: "20 mg", desde: "2026-10-30" }).ok, false);
});

test("efeito: descrição curta recusada, intensidade só 1 a 3, dia dentro do período", () => {
  const v = (e: Parameters<typeof validarEfeito>[0]) => validarEfeito(e, INICIO, agora, SP);
  assert.equal(v({ descricao: "x" }).ok, false);
  assert.equal(v({ descricao: "enjoo ao acordar", intensidade: 4 }).ok, false);
  const ok = v({ descricao: " enjoo ao acordar ", intensidade: 2 });
  assert.ok(ok.ok);
  assert.equal(ok.ok && ok.valor.descricao, "enjoo ao acordar");
  assert.equal(ok.ok && ok.valor.dia, "2026-10-11");
  assert.equal(v({ descricao: "dor de cabeça", dia: "2026-08-01" }).ok, false);
});

/* ----------------------- identificação do medicamento --------------------- */

test("nome exato é confirmado; erro de digitação PEDE confirmação; citalopram e outros são 'outro'", () => {
  const id = (s: string) => identificarMedicamento(s, TEMAS);
  assert.deepEqual(id("escitalopram"), { tipo: "confirmado", medicamentoId: "escitalopram", nome: "Escitalopram" });
  assert.deepEqual(id("Oxalato de Escitalopram"), { tipo: "confirmado", medicamentoId: "escitalopram", nome: "Escitalopram" });

  const typo = id("exscitalopram");
  assert.equal(typo.tipo, "confirmar");
  assert.equal(typo.tipo === "confirmar" && typo.sugestao, "Escitalopram");
  assert.equal(typo.tipo === "confirmar" && typo.digitado, "exscitalopram");

  const cit = id("citalopram");
  assert.equal(cit.tipo, "outro");
  assert.equal(cit.tipo === "outro" && cit.naoE, "escitalopram");

  assert.equal(id("paracetamol").tipo, "outro");
  assert.equal(id(" ").tipo, "vazio");
});

/* --------------------------- resumo para a consulta ----------------------- */

test("o resumo para a consulta traz só o que foi registrado, sem interpretar nem concluir", () => {
  const texto = montarResumoParaConsulta({
    nome: "Escitalopram",
    inicio: INICIO,
    horario: "08:00",
    doses: [
      { descricao: "10 mg", desde: INICIO },
      { descricao: "20 mg", desde: DOSE_NOVA },
    ],
    tomadas: [...tomou(dias("2026-10-06", "2026-10-11")), { dia: "2026-10-05", estado: "nao_tomou" }],
    efeitos: [{ dia: "2026-10-09", descricao: "enjoo ao acordar", intensidade: 1 }],
    agora,
    tz: SP,
  });
  assert.match(texto, /Resumo do que eu registrei — Escitalopram/);
  assert.match(texto, /Início do tratamento \(informado por mim\): 11\/09\/2026 — 30 dias completos/);
  assert.match(texto, /- 10 mg, desde 11\/09\/2026/);
  assert.match(texto, /- 20 mg, desde 08\/10\/2026/);
  assert.match(texto, /Dose atual informada: 20 mg, há 3 dias completos/);
  assert.match(texto, /Dias com registro: 7 \(tomou: 6; não tomou: 1\)/);
  assert.match(texto, /Dia sem registro não quer dizer que não tomei/);
  assert.match(texto, /09\/10\/2026: enjoo ao acordar \(leve\)/);
  assert.match(texto, /o app não os interpreta/);
  // nada de interpretação
  assert.doesNotMatch(texto, /melhor|piora|eficaz|funcion|resposta ao tratamento|adesão|normal/i);
});

test("o resumo sem doses nem efeitos diz isso, em vez de inventar", () => {
  const t = montarResumoParaConsulta({ nome: "Meu medicamento", inicio: INICIO, doses: [], tomadas: [], efeitos: [], agora, tz: SP });
  assert.match(t, /Não informei doses/);
  assert.match(t, /Não anotei efeitos/);
});
