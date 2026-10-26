import { test } from "node:test";
import assert from "node:assert/strict";
import {
  alcancadas,
  escolherCelebracao,
  etapasDoAcompanhamento,
  etapasDoMarco,
  etapasDoSono,
  janela,
  posicionar,
  textoRetomada,
} from "./progressao.ts";
import { DIA_MS, HORA_MS } from "./datas.ts";

test("a trilha sempre abre com uma etapa inicial que não comemora", () => {
  for (const etapas of [etapasDoMarco("cigarro"), etapasDoAcompanhamento(), etapasDoSono()]) {
    assert.equal(etapas[0].inicial, true);
    assert.equal(etapas[0].limiar, 0);
    assert.ok(!alcancadas(etapas, 0).includes(etapas[0].chave), "a abertura não é 'atingida'");
  }
});

test("chaves de etapa são únicas dentro de cada trilha (são a chave de deduplicação)", () => {
  for (const etapas of [etapasDoMarco("cigarro"), etapasDoMarco("personalizado"), etapasDoAcompanhamento(), etapasDoSono()]) {
    const chaves = etapas.map((e) => e.chave);
    assert.equal(new Set(chaves).size, chaves.length);
    assert.ok(!chaves.includes("_base"), "_base é reservada");
  }
});

test("posição: onde estou, o que já conquistei e qual é o próximo passo", () => {
  const etapas = etapasDoAcompanhamento();
  const p = posicionar(etapas, 10 * DIA_MS);

  assert.equal(p.ultima?.chave, "7d");
  assert.equal(p.atual?.chave, "14d");
  assert.equal(p.concluidas, 2); // 3d e 7d; a abertura não conta
  assert.equal(p.total, 8);
  assert.equal(p.falta, 4 * DIA_MS);
  assert.ok(Math.abs(p.progresso - 3 / 7) < 1e-9); // 3 dias de um trecho de 7

  const estados = Object.fromEntries(p.etapas.map((e) => [e.chave, e.estado]));
  assert.equal(estados["inicio"], "concluida");
  assert.equal(estados["7d"], "concluida");
  assert.equal(estados["14d"], "atual");
  assert.equal(estados["30d"], "proxima");
  assert.equal(p.etapas.filter((e) => e.estado === "atual").length, 1);
});

test("posição no começo: nenhuma conquista ainda, e a primeira é o alvo", () => {
  const p = posicionar(etapasDoMarco("cigarro"), 0);
  assert.equal(p.ultima, null);
  assert.equal(p.concluidas, 0);
  assert.equal(p.atual?.chave, "20min");
  assert.equal(p.progresso, 0);
});

test("posição ao fim da trilha: sem alvo, progresso cheio, nada negativo", () => {
  const etapas = etapasDoSono();
  const p = posicionar(etapas, 500);
  assert.equal(p.atual, null);
  assert.equal(p.progresso, 1);
  assert.equal(p.falta, 0);
  assert.equal(p.concluidas, p.total);
});

test("valor negativo (relógio adiantado) é tratado como zero", () => {
  const p = posicionar(etapasDoAcompanhamento(), -5 * DIA_MS);
  assert.equal(p.concluidas, 0);
  assert.equal(p.progresso, 0);
});

test("a trilha só cresce: mais valor nunca desconclui uma etapa", () => {
  const etapas = etapasDoMarco("cigarro");
  let anterior = 0;
  for (let h = 0; h <= 24 * 400; h += 7) {
    const c = posicionar(etapas, h * HORA_MS).concluidas;
    assert.ok(c >= anterior, `retrocedeu em ${h}h`);
    anterior = c;
  }
});

test("sono conta noites registradas, não horas dormidas", () => {
  const etapas = etapasDoSono();
  assert.deepEqual(alcancadas(etapas, 0), []);
  assert.deepEqual(alcancadas(etapas, 1), ["n1"]);
  assert.deepEqual(alcancadas(etapas, 7), ["n1", "n3", "n7"]);
  assert.equal(etapas.find((e) => e.chave === "n1")?.titulo, "Primeira noite registrada");
  // nenhuma etapa de sono fala em horas, qualidade ou dormir mais
  for (const e of etapas) assert.ok(!/hora|qualidade|melhor|mais sono/i.test(e.titulo), e.titulo);
});

test("só marcos de verdade (dia, semana, mês...) são relevantes — celebração é rara", () => {
  const etapas = etapasDoMarco("cigarro").filter((e) => !e.inicial);
  const relevantes = etapas.filter((e) => e.relevante);
  assert.ok(relevantes.length > 0);
  assert.ok(relevantes.length < etapas.length / 2, "mais da metade relevante vira confete em tudo");
  assert.ok(relevantes.every((e) => e.limiar >= DIA_MS), "20 minutos não é motivo de festa grande");
  const rel = etapasDoAcompanhamento().filter((e) => e.relevante).map((e) => e.chave);
  assert.deepEqual(rel, ["7d", "30d", "90d", "365d"]);
});

test("celebração: nada pendente → nada a mostrar; já vista → não repete", () => {
  const etapas = etapasDoAcompanhamento();
  assert.equal(escolherCelebracao(etapas, [], new Set()), null);
  assert.equal(escolherCelebracao(etapas, ["3d"], new Set(["3d"])), null);
  // recarregar a página = mesma entrada = mesmo resultado, até alguém marcar como vista
  const a = escolherCelebracao(etapas, ["3d"], new Set());
  const b = escolherCelebracao(etapas, ["3d"], new Set());
  assert.deepEqual(a, b);
  assert.equal(a?.etapa.chave, "3d");
});

test("celebração: a abertura nunca comemora, mesmo se alguém a incluir nas atingidas", () => {
  const etapas = etapasDoAcompanhamento();
  assert.equal(escolherCelebracao(etapas, ["inicio"], new Set()), null);
});

test("celebração: relevante é 'grande', o resto é discreto", () => {
  const etapas = etapasDoAcompanhamento();
  assert.equal(escolherCelebracao(etapas, ["3d"], new Set())?.nivel, "discreta");
  assert.equal(escolherCelebracao(etapas, ["3d", "7d"], new Set(["3d"]))?.nivel, "grande");
});

test("várias pendentes viram UMA celebração, com a relevante em destaque e um '+N'", () => {
  const etapas = etapasDoAcompanhamento();
  // ficou 40 dias sem abrir: 3d, 7d, 14d e 30d pendentes
  const c = escolherCelebracao(etapas, ["3d", "7d", "14d", "30d"], new Set());
  assert.equal(c?.etapa.chave, "30d"); // relevante E a mais avançada
  assert.equal(c?.outras, 3);

  // 3d, 7d, 14d pendentes: a relevante (7d) vence a mais avançada (14d)
  const d = escolherCelebracao(etapas, ["3d", "7d", "14d"], new Set());
  assert.equal(d?.etapa.chave, "7d");
  assert.equal(d?.nivel, "grande");
  assert.equal(d?.outras, 2);
});

test("janela: cabe na tela, centra no alvo e conta o que ficou escondido", () => {
  const p = posicionar(etapasDoMarco("cigarro"), 20 * DIA_MS);
  const j = janela(p.etapas, 6);
  assert.equal(j.itens.length, 6);
  assert.ok(j.itens.some((e) => e.estado === "atual"));
  assert.equal(j.antes + j.itens.length + j.depois, p.etapas.length);
  assert.ok(j.antes > 0 && j.depois > 0);

  const curta = posicionar(etapasDoSono(), 3);
  const k = janela(curta.etapas, 20);
  assert.equal(k.itens.length, curta.etapas.length);
  assert.equal(k.antes + k.depois, 0);
});

test("janela nas pontas não passa do início nem do fim", () => {
  const etapas = etapasDoMarco("cigarro");
  const comeco = janela(posicionar(etapas, 0).etapas, 6);
  assert.equal(comeco.antes, 0);
  const fim = janela(posicionar(etapas, 99 * 365 * DIA_MS).etapas, 6);
  assert.equal(fim.depois, 0);
  assert.equal(fim.itens.length, 6);
});

test("retomada: sem culpa e só quando há uma pausa de verdade", () => {
  assert.equal(textoRetomada("sono", null), null); // nunca registrou: nada a "retomar"
  assert.equal(textoRetomada("sono", 0), null);
  assert.equal(textoRetomada("sono", 2), null);
  const t = textoRetomada("sono", 5) ?? "";
  assert.ok(t.length > 0);
  for (const proibida of ["perdeu", "falhou", "quebrou", "zerou", "desistiu", "preguiça", "!"]) {
    assert.ok(!t.toLowerCase().includes(proibida), `retomada não pode dizer "${proibida}"`);
  }
  assert.match(t, /continua aqui/);
  assert.equal(textoRetomada("marco", 9), null);
});
