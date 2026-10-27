import { test } from "node:test";
import assert from "node:assert/strict";
import { temaPorId } from "./catalogo.ts";
import { FONTES } from "./fontes.ts";
import { preset } from "../habitos.ts";
import { beneficioDe } from "../beneficios.ts";

/** Frases que transformariam "o que a fonte descreve" em promessa para a pessoa. */
const PROMESSA_PESSOAL = /voc[eê] (vai|j[aá] deveria|deve) (sentir|melhorar|estar melhor)|com certeza|garant/i;

test("escitalopram: cada fase traz o que a fonte diz para aquele momento, sem virar promessa", () => {
  const esc = temaPorId("escitalopram")!;
  const texto = (limiar: number) => esc.marcos.find((m) => m.limiar === limiar)!.texto;
  assert.match(texto(1), /segundo a bula, os efeitos colaterais costumam ser leves e desaparecer em alguns dias/i);
  assert.match(texto(3), /náusea, dor de cabeça e mudanças no sono e no apetite/);
  assert.match(texto(7), /normalizar nas 2 primeiras semanas/);
  assert.match(texto(14), /cerca de duas semanas para começar a se sentir melhor/);
  assert.match(texto(21), /de 2 a 4 semanas/);
  assert.match(texto(90), /cerca de 3 meses/);
  assert.match(texto(180), /6 meses/);
  assert.match(texto(180), /não quer dizer que é hora de parar/);
  for (const m of esc.marcos) assert.doesNotMatch(`${m.titulo} ${m.texto}`, PROMESSA_PESSOAL, m.chave);
});

test("escitalopram: as fases citadas ligam a afirmações cujas fontes foram lidas", () => {
  const esc = temaPorId("escitalopram")!;
  for (const m of esc.marcos) {
    for (const id of m.afirmacoes ?? []) {
      const a = esc.beneficios.find((b) => b.id === id)!;
      for (const f of a.fontes) assert.equal(FONTES[f]?.verificacao, "pagina lida", `${m.chave}/${id}/${f}`);
    }
  }
});

test("unhas: 30 e 60 dias falam do crescimento médio da unha, sem prazo de recuperação", () => {
  const unhas = temaPorId("unhas")!;
  assert.match(unhas.marcos.find((m) => m.limiar === 30)!.texto, /3,5 mm por mês/);
  assert.match(beneficioDe("unhas", "60d")!.texto, /perto de 7 mm/);
  for (const chave of ["30d", "60d"]) {
    const b = beneficioDe("unhas", chave)!;
    assert.match(b.ressalva ?? "", /média/);
    assert.doesNotMatch(b.texto, /recuperad|voltam? ao normal/i);
  }
});

test("vape, álcool e cafeína: as notificações dizem 'segundo' a fonte nas fases com prazo", () => {
  const corpo = (p: string, chave: string) => preset(p).marcos.find((m) => m.chave === chave)!.corpo;
  assert.match(corpo("vape", "3d"), /Segundo o NHS/);
  assert.match(corpo("vape", "7d"), /Segundo o CDC/);
  assert.match(corpo("alcool", "1d"), /Segundo o MedlinePlus/);
  assert.match(corpo("alcool", "7d"), /Segundo o NHS/);
  assert.match(corpo("cafeina", "2d"), /Segundo o MedlinePlus/);
  for (const [p, chave] of [["vape", "3d"], ["alcool", "1d"], ["cafeina", "12h"]] as const) {
    assert.doesNotMatch(corpo(p, chave), PROMESSA_PESSOAL, `${p}/${chave}`);
  }
});
