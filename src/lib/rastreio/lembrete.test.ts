import { test } from "node:test";
import assert from "node:assert/strict";
import { decidirLembrete, JANELA_LEMBRETE_MIN, minutosDoHorario, minutosLocais, type EntradaLembrete } from "./lembrete.ts";

// Dados de TESTE: nome e dose fictícios, só aqui.
const base: EntradaLembrete = {
  lembrete: true,
  lembreteDetalhado: false,
  horario: "08:00",
  arquivado: false,
  nome: "Remedio de Teste",
  dose: "15 mg",
  registradoHoje: false,
  minutosAgora: 8 * 60 + 5,
};
const com = (extra: Partial<EntradaLembrete>) => decidirLembrete({ ...base, ...extra });

test("só existe com o lembrete ligado e um horário informado", () => {
  assert.ok(com({}));
  assert.equal(com({ lembrete: false }), null);
  assert.equal(com({ horario: null }), null);
  assert.equal(com({ horario: "8h" }), null, "horário malformado não vira lembrete");
  assert.equal(com({ arquivado: true }), null);
});

test("a janela vai do horário até 2 h depois: antes não sai, e depois não insiste", () => {
  assert.equal(com({ minutosAgora: 7 * 60 + 59 }), null);
  assert.ok(com({ minutosAgora: 8 * 60 }));
  assert.ok(com({ minutosAgora: 8 * 60 + JANELA_LEMBRETE_MIN - 1 }));
  assert.equal(com({ minutosAgora: 8 * 60 + JANELA_LEMBRETE_MIN }), null);
  assert.equal(com({ minutosAgora: 23 * 60 }), null);
});

test("quem já registrou o dia (tomou ou não) não recebe lembrete", () => {
  assert.equal(com({ registradoHoje: true }), null);
});

test("o texto padrão NÃO cita medicamento, dose nem tratamento", () => {
  const t = com({})!;
  const tudo = `${t.titulo} ${t.corpo}`;
  assert.doesNotMatch(tudo, /Remedio de Teste|15 mg|\bmg\b|medicament|tratament|dose|rem[eé]dio/i);
});

test("o texto detalhado só existe se a pessoa escolheu, e então traz nome e dose informados", () => {
  const t = com({ lembreteDetalhado: true })!;
  assert.match(t.titulo, /Remedio de Teste/);
  assert.match(t.corpo, /15 mg/);
  const semDose = com({ lembreteDetalhado: true, dose: null })!;
  assert.doesNotMatch(semDose.corpo, /Dose informada/);
});

test("nenhum texto pressiona: sem sequência, sem 'não perca', sem culpa", () => {
  for (const det of [false, true]) {
    const t = com({ lembreteDetalhado: det })!;
    assert.doesNotMatch(`${t.titulo} ${t.corpo}`, /sequ[eê]ncia|dias seguidos|n[aã]o perca|n[aã]o esque[cç]a|atrasad|falhou|culpa/i);
  }
});

test("minutosDoHorario aceita HH:mm e recusa o resto", () => {
  assert.equal(minutosDoHorario("00:00"), 0);
  assert.equal(minutosDoHorario("23:59"), 23 * 60 + 59);
  assert.equal(minutosDoHorario("24:00"), null);
  assert.equal(minutosDoHorario("8:00"), null);
  assert.equal(minutosDoHorario(null), null);
});

test("minutosLocais respeita o fuso (não é a hora UTC do servidor)", () => {
  const instante = new Date("2026-10-27T11:30:00Z");
  assert.equal(minutosLocais("America/Sao_Paulo", instante), 8 * 60 + 30);
  assert.equal(minutosLocais("UTC", instante), 11 * 60 + 30);
  assert.equal(minutosLocais("Asia/Tokyo", instante), 20 * 60 + 30);
  assert.equal(minutosLocais("Fuso/Invalido", instante), 11 * 60 + 30, "fuso inválido cai em UTC, sem lançar");
});

test("meia-noite: 00:xx é 0..59 minutos, não 24 h", () => {
  assert.equal(minutosLocais("UTC", new Date("2026-10-27T00:10:00Z")), 10);
});
