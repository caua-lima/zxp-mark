import { test } from "node:test";
import assert from "node:assert/strict";
import { PRESETS, TEMA_DO_PRESET, DIA, preset } from "../habitos.ts";
import { detectarHabito } from "../deteccao.ts";
import { temaPorId } from "./catalogo.ts";
import { PROMESSAS } from "./validacao.ts";

test("'roer unhas' vira marco do tipo 'unhas', pelas formas que as pessoas escrevem", () => {
  for (const t of ["Roer unhas", "roer unha", "morder as unhas", "onicofagia", "parar de roer as unhas", "Estou roendo unhas"]) {
    const d = detectarHabito(t);
    assert.equal(d.preset, "unhas", t);
    assert.equal(d.reconhecido, true, t);
  }
});

test("'fazer as unhas' (manicure) não é o hábito de roer", () => {
  assert.notEqual(detectarHabito("fazer as unhas").preset, "unhas");
  assert.notEqual(detectarHabito("viagem para Paris").preset, "unhas");
});

test("os marcos de unhas são os do tema (1, 3, 7, 10, 14 e 30 dias), em ordem, sem horas e sem repetição de chave", () => {
  const p = preset("unhas");
  const tema = temaPorId("unhas")!;
  const doTema = p.marcos.filter((m) => m.ms <= 30 * DIA);
  assert.deepEqual(doTema.map((m) => m.chave), ["1d", "3d", "7d", "10d", "14d", "30d"]);
  for (const m of tema.marcos) {
    const marco = p.marcos.find((x) => x.chave === `${m.limiar}d`)!;
    assert.equal(marco.titulo, m.titulo);
    assert.equal(marco.corpo, m.texto);
  }
  assert.equal(new Set(p.marcos.map((m) => m.chave)).size, p.marcos.length);
  assert.deepEqual([...p.marcos].sort((a, b) => a.ms - b.ms), p.marcos);
  assert.ok(p.marcos.every((m) => m.ms >= DIA), "roer unha não tem marco de 'horas'");
});

test("os marcos de unhas não prometem recuperação nem prazo, e não afirmam nada sobre infecção", () => {
  for (const m of preset("unhas").marcos) {
    assert.doesNotMatch(m.corpo, PROMESSAS, m.chave);
    assert.doesNotMatch(m.corpo, /recuperad|cicatriz|curad|infec[cç][aã]o (acabou|passou)/i, m.chave);
  }
  assert.match(preset("unhas").marcos.find((m) => m.chave === "10d")!.corpo, /O que você percebeu até aqui\?/);
});

test("todo marco que aponta para um tema aponta para um tema que existe, e o tipo de marco também existe", () => {
  for (const [presetId, temaId] of Object.entries(TEMA_DO_PRESET)) {
    assert.ok(PRESETS.some((p) => p.id === presetId), presetId);
    assert.ok(temaPorId(temaId), temaId);
  }
});

test("o contexto do marco de unhas manda o chat não prometer recuperação nem diagnosticar", () => {
  assert.match(preset("unhas").contexto, /Não prometa recuperação/);
  assert.match(preset("unhas").contexto, /Não diagnostique/);
});
