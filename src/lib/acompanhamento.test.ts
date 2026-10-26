import { test } from "node:test";
import assert from "node:assert/strict";
import {
  categoria,
  descreverTempo,
  interpretarEdicao,
  interpretarNovo,
} from "./acompanhamento.ts";
import { instanteLocal } from "./datas.ts";

const SP = "America/Sao_Paulo";
const agora = instanteLocal("2026-10-26T10:00", SP)!.getTime();

function ok<T>(r: { ok: true; valor: T } | { ok: false; erro: string }): T {
  assert.ok(r.ok, r.ok ? "" : r.erro);
  return r.valor;
}
function erro(r: { ok: boolean; erro?: string }): string {
  assert.equal(r.ok, false);
  return r.erro ?? "";
}

test("criar: normaliza e aplica os padrões da categoria", () => {
  const v = ok(interpretarNovo({ titulo: "  Início do tratamento ", categoria: "tratamento", inicio: "2026-10-14" }, SP, agora));
  assert.equal(v.titulo, "Início do tratamento");
  assert.equal(v.emoji, "🩺"); // padrão da categoria quando não escolhem
  assert.equal(v.tom, "magenta");
  assert.equal(v.descricao, null);
  // data sem hora = meia-noite do fuso do usuário
  assert.equal(v.inicio.toISOString(), "2026-10-14T03:00:00.000Z");
});

test("criar: recusa título curto, categoria/cor/ícone fora da lista", () => {
  assert.match(erro(interpretarNovo({ titulo: "a", inicio: "2026-10-14" }, SP, agora)), /nome/);
  assert.match(erro(interpretarNovo({ titulo: "ok", categoria: "vício", inicio: "2026-10-14" }, SP, agora)), /categoria/);
  assert.match(erro(interpretarNovo({ titulo: "ok", tom: "neon", inicio: "2026-10-14" }, SP, agora)), /cor/);
  assert.match(erro(interpretarNovo({ titulo: "ok", emoji: "abc", inicio: "2026-10-14" }, SP, agora)), /ícone/);
});

test("criar: data de início futura aponta para a aba Regressiva, e data impossível é recusada", () => {
  assert.match(erro(interpretarNovo({ titulo: "ok", inicio: "2026-12-01" }, SP, agora)), /Regressiva/);
  assert.match(erro(interpretarNovo({ titulo: "ok", inicio: "2026-02-30" }, SP, agora)), /válida/);
  assert.match(erro(interpretarNovo({ titulo: "ok", inicio: "" }, SP, agora)), /válida/);
  assert.match(erro(interpretarNovo({ titulo: "ok", inicio: "1900-01-01" }, SP, agora)), /distante/);
});

test("criar: começar agora (poucos minutos à frente por relógio adiantado) é aceito", () => {
  const daquiA3Min = new Date(agora + 3 * 60_000);
  const hh = String(daquiA3Min.getUTCHours() - 3).padStart(2, "0");
  const mm = String(daquiA3Min.getUTCMinutes()).padStart(2, "0");
  ok(interpretarNovo({ titulo: "ok", inicio: `2026-10-26T${hh}:${mm}` }, SP, agora));
});

test("criar: descrição passa de 500 caracteres → erro; em branco → null", () => {
  assert.match(erro(interpretarNovo({ titulo: "ok", inicio: "2026-10-14", descricao: "x".repeat(501) }, SP, agora)), /500/);
  assert.equal(ok(interpretarNovo({ titulo: "ok", inicio: "2026-10-14", descricao: "   " }, SP, agora)).descricao, null);
});

test("editar: só devolve o que veio, e valida cada campo", () => {
  assert.deepEqual(ok(interpretarEdicao({}, SP, agora)), {});
  assert.deepEqual(ok(interpretarEdicao({ titulo: " Novo nome " }, SP, agora)), { titulo: "Novo nome" });
  assert.equal(ok(interpretarEdicao({ descricao: "" }, SP, agora)).descricao, null);
  assert.match(erro(interpretarEdicao({ titulo: "" }, SP, agora)), /nome/);
  assert.match(erro(interpretarEdicao({ inicio: "2027-01-01" }, SP, agora)), /Regressiva/);
  assert.equal(ok(interpretarEdicao({ inicio: "2026-10-01T08:30" }, SP, agora)).inicio?.toISOString(), "2026-10-01T11:30:00.000Z");
});

test("tempo: dias completos em destaque, 'dia N' à parte, frase honesta", () => {
  const inicio = instanteLocal("2026-10-14T00:00", SP)!;
  const t = descreverTempo("tratamento", inicio, agora, SP);
  assert.equal(t.diasCompletos, 12);
  assert.equal(t.diaN, 13); // o dia do início é o dia 1
  assert.deepEqual(t.heroi, { valor: 12, unidade: "dias" });
  assert.equal(t.frase, "12 dias desde o início do tratamento");
});

test("tempo: a frase de tratamento nunca afirma dose, adesão ou melhora", () => {
  const inicio = instanteLocal("2026-10-01T00:00", SP)!;
  const frase = descreverTempo("tratamento", inicio, agora, SP).frase.toLowerCase();
  for (const proibida of ["dose", "tomou", "em dia", "adesão", "melhor", "curado", "sem falhar"]) {
    assert.ok(!frase.includes(proibida), `frase não pode conter "${proibida}": ${frase}`);
  }
  assert.match(categoria("tratamento").aviso ?? "", /não registra doses/);
  assert.equal(categoria("rotina").aviso, undefined);
});

test("tempo: singular, e antes de 24h o herói são as horas — nunca '0 dias'", () => {
  assert.equal(descreverTempo("rotina", instanteLocal("2026-10-25T10:00", SP)!, agora, SP).heroi.unidade, "dia");

  const cincoHoras = descreverTempo("projeto", instanteLocal("2026-10-26T05:00", SP)!, agora, SP);
  assert.deepEqual(cincoHoras.heroi, { valor: 5, unidade: "horas" });
  assert.equal(cincoHoras.diasCompletos, 0);
  assert.equal(cincoHoras.diaN, 1);
  assert.equal(cincoHoras.frase, "5 horas desde o início do projeto");

  const recem = descreverTempo("pessoal", instanteLocal("2026-10-26T09:40", SP)!, agora, SP);
  assert.equal(recem.heroi.unidade, "min");
  assert.equal(recem.frase, "Acabou de começar");
});

test("tempo: início 'amanhã' por engano não produz número negativo", () => {
  const t = descreverTempo("pessoal", instanteLocal("2026-11-01T00:00", SP)!, agora, SP);
  assert.equal(t.diasCompletos, 0);
  assert.ok(t.heroi.valor >= 0);
  assert.equal(t.diaN, 1);
});

test("categoria desconhecida cai em 'pessoal', nunca em tratamento", () => {
  assert.equal(categoria("???").id, "pessoal");
  assert.equal(categoria("???").aviso, undefined);
});
