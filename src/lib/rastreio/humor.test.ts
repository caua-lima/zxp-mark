import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AVISO_SEM_CAUSA,
  compararSemanas,
  cruzarHumorESono,
  descreverComparacao,
  observarHumorPorSono,
  validarHumor,
} from "./humor.ts";
import { somarDias } from "./episodios.ts";
import { instanteLocal } from "../datas.ts";

const SP = "America/Sao_Paulo";
const agora = instanteLocal("2026-10-11T10:00", SP)!.getTime();
const HOJE = "2026-10-11";

const serie = (de: number, ate: number, valor: (i: number) => number) => {
  const l: { dia: string; valor: number }[] = [];
  for (let i = de; i <= ate; i++) l.push({ dia: somarDias(HOJE, -i), valor: valor(i) });
  return l;
};

test("humor: de 1 a 5, dia no passado ou hoje, nota curta; energia e ansiedade são opcionais", () => {
  const ok = validarHumor({ humor: 4, energia: 3, nota: " dia tranquilo " }, agora, SP);
  assert.ok(ok.ok);
  assert.deepEqual(ok.ok && [ok.valor.dia, ok.valor.humor, ok.valor.energia, ok.valor.ansiedade, ok.valor.nota], [HOJE, 4, 3, null, "dia tranquilo"]);
  assert.equal(validarHumor({ humor: 0 }, agora, SP).ok, false);
  assert.equal(validarHumor({ humor: 6 }, agora, SP).ok, false);
  assert.equal(validarHumor({ humor: 3, energia: 9 }, agora, SP).ok, false);
  assert.equal(validarHumor({ humor: 3, dia: "2026-10-12" }, agora, SP).ok, false);
  assert.equal(validarHumor({ humor: 3, dia: "2026-02-30" }, agora, SP).ok, false);
  assert.equal(validarHumor({ humor: 3, nota: "x".repeat(301) }, agora, SP).ok, false);
  assert.equal(validarHumor({ humor: 2.5 }, agora, SP).ok, false);
});

test("comparar semanas exige dias suficientes nos DOIS lados; senão não há observação", () => {
  const poucos = serie(0, 1, () => 4); // 2 dias só
  assert.equal(compararSemanas(poucos, HOJE), null);
  const soAtual = serie(0, 6, () => 4);
  assert.equal(compararSemanas(soAtual, HOJE), null, "sem a semana anterior não dá para comparar");
  assert.equal(descreverComparacao("qualidade de sono", null), null);
});

test("exemplo do briefing: 'você registrou melhor qualidade de sono nesta semana' — sem causa", () => {
  const v = [...serie(0, 6, () => 4), ...serie(7, 13, () => 3)];
  const c = compararSemanas(v, HOJE);
  assert.ok(c);
  assert.equal(c.atual.n, 7);
  assert.equal(c.anterior.n, 7);
  const texto = descreverComparacao("qualidade de sono", c) as string;
  assert.match(texto, /nesta semana foi maior/);
  assert.match(texto, /4,0 contra 3,0/);
  assert.match(texto, /7 dias nesta semana contra 7 na anterior/);
  assert.doesNotMatch(texto, /porque|graças|causa|devido|melhorou seu|por causa/i);
});

test("diferença pequena é descrita como 'parecida', e queda como 'menor'", () => {
  const parecida = compararSemanas([...serie(0, 4, () => 3.2), ...serie(7, 11, () => 3)], HOJE)!;
  assert.match(descreverComparacao("humor", parecida) as string, /parecida nas duas semanas/);
  const queda = compararSemanas([...serie(0, 4, () => 2), ...serie(7, 11, () => 4)], HOJE)!;
  assert.match(descreverComparacao("humor", queda) as string, /foi menor/);
});

test("a janela das semanas respeita o calendário: dia 7 atrás já é a semana anterior", () => {
  const v = [{ dia: somarDias(HOJE, -7), valor: 1 }, { dia: somarDias(HOJE, -8), valor: 1 }, { dia: somarDias(HOJE, -9), valor: 1 },
            { dia: HOJE, valor: 5 }, { dia: somarDias(HOJE, -1), valor: 5 }, { dia: somarDias(HOJE, -6), valor: 5 }];
  const c = compararSemanas(v, HOJE)!;
  assert.equal(c.atual.n, 3);
  assert.equal(c.anterior.n, 3);
  assert.equal(c.atual.media, 5);
  assert.equal(c.anterior.media, 1);
});

test("humor × sono: dia a dia, com buraco como null (nunca zero)", () => {
  const t = cruzarHumorESono([{ dia: HOJE, humor: 4 }], [{ dia: HOJE, qualidade: 5 }, { dia: somarDias(HOJE, -1), qualidade: 2 }], HOJE, 3);
  assert.equal(t.length, 3);
  assert.deepEqual(t[2], { dia: HOJE, humor: 4, sonoQualidade: 5 });
  assert.deepEqual(t[1], { dia: somarDias(HOJE, -1), humor: null, sonoQualidade: 2 });
  assert.deepEqual(t[0], { dia: somarDias(HOJE, -2), humor: null, sonoQualidade: null });
});

test("com poucos dias dos dois registros, o app admite que não há base para comparar", () => {
  const h = [1, 2, 3].map((i) => ({ dia: somarDias(HOJE, -i), humor: 4 }));
  const s = [1, 2, 3].map((i) => ({ dia: somarDias(HOJE, -i), qualidade: 5 }));
  const o = observarHumorPorSono(cruzarHumorESono(h, s, HOJE, 14));
  assert.equal(o.diasComAmbos, 3);
  assert.match(o.texto, /Ainda há poucos dias/);
  assert.match(o.texto, /sem concluir causa/);
});

test("com dias suficientes nos dois grupos, DESCREVE a diferença e lembra que não prova causa", () => {
  const dias = (de: number, ate: number) => Array.from({ length: ate - de + 1 }, (_, k) => somarDias(HOJE, -(de + k)));
  const bons = dias(0, 3); // sono 4–5
  const ruins = dias(4, 7); // sono 1–3
  const humores = [...bons.map((dia) => ({ dia, humor: 4 })), ...ruins.map((dia) => ({ dia, humor: 2 }))];
  const sono = [...bons.map((dia) => ({ dia, qualidade: 5 })), ...ruins.map((dia) => ({ dia, qualidade: 2 }))];
  const o = observarHumorPorSono(cruzarHumorESono(humores, sono, HOJE, 14));
  assert.equal(o.diasComAmbos, 8);
  assert.match(o.texto, /Nos 4 dias em que você registrou sono de qualidade 4 ou 5, o humor médio registrado foi 4,0/);
  assert.match(o.texto, /nos 4 dias com qualidade de 1 a 3, foi 2,0/);
  assert.ok(o.texto.endsWith(AVISO_SEM_CAUSA));
  assert.doesNotMatch(o.texto, /porque|graças|melhorou|piorou|devido|por causa|efeito/i);
});

test("um dos grupos pequeno demais derruba a comparação mesmo havendo muitos dias no outro", () => {
  const dias = (de: number, ate: number) => Array.from({ length: ate - de + 1 }, (_, k) => somarDias(HOJE, -(de + k)));
  const bons = dias(0, 9); // 10 dias de sono bom
  const ruins = dias(10, 11); // só 2 de sono ruim
  const o = observarHumorPorSono(
    cruzarHumorESono(
      [...bons, ...ruins].map((dia) => ({ dia, humor: 3 })),
      [...bons.map((dia) => ({ dia, qualidade: 5 })), ...ruins.map((dia) => ({ dia, qualidade: 2 }))],
      HOJE,
      14
    )
  );
  assert.match(o.texto, /Ainda há poucos dias/);
});
