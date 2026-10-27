import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AVISO_BENEFICIO,
  FONTES,
  TODOS_OS_BENEFICIOS,
  beneficioDe,
  chavesComBeneficio,
  conteudoDaEtapa,
  rotuloDoBeneficio,
} from "./beneficios.ts";
import { PRESETS } from "./habitos.ts";
import { etapasDoAcompanhamento, etapasDoMarco, etapasDoSono } from "./progressao.ts";

/** Linguagem de certeza que nenhum texto de saúde do app pode usar. */
/** "Não há prazo comprovado" é o oposto de uma promessa (o validador do catálogo faz a mesma distinção). */
const semNegacao = (t: string) => t.replace(/(^|[^a-zç])n[aã]o (há|ha|existe|existem) [^.]*?comprovad[a-z]*/gi, "$1");
const CERTEZA = /\b(garant\w*|cura\w*|curad[oa]s?|comprovad[oa]s?|certamente|com certeza|100%|milagr\w*|sempre melhora)\b/i;

test("toda fonte tem URL https, data de verificação ISO e id igual à chave", () => {
  for (const [chave, f] of Object.entries(FONTES)) {
    assert.equal(f.id, chave);
    assert.match(f.url, /^https:\/\//);
    assert.match(f.verificadoEm, /^\d{4}-\d{2}-\d{2}$/);
    if (f.dataDaPagina !== null) assert.match(f.dataDaPagina, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(f.titulo.length > 3 && f.orgao.length > 1);
    assert.ok(["pagina lida", "resumo de busca"].includes(f.verificacao));
  }
});

test("todo benefício aponta para uma fonte que existe e usa linguagem de possibilidade", () => {
  let total = 0;
  for (const grupo of Object.values(TODOS_OS_BENEFICIOS)) {
    for (const [chave, b] of Object.entries(grupo)) {
      total++;
      assert.ok(FONTES[b.fonteId], `${chave}: fonte "${b.fonteId}" não existe`);
      assert.ok(!CERTEZA.test(b.texto), `${chave}: linguagem de certeza em "${b.texto}"`);
      assert.ok(b.texto.endsWith("."), chave);
    }
  }
  assert.ok(total >= 10);
});

test("toda chave de benefício existe como etapa do hábito (sem benefício órfão)", () => {
  for (const [presetId, grupo] of Object.entries(TODOS_OS_BENEFICIOS)) {
    if (presetId === "geral") continue;
    const chaves = new Set(PRESETS.find((p) => p.id === presetId)!.marcos.map((m) => m.chave));
    for (const k of Object.keys(grupo)) assert.ok(chaves.has(k), `${presetId}/${k} não é uma etapa`);
  }
});

test("só cigarro, unhas, vape, álcool e cafeína têm conteúdo de saúde (todos com fonte) — nenhum outro hábito ganha afirmação sem fonte", () => {
  assert.deepEqual(Object.keys(TODOS_OS_BENEFICIOS).sort(), ["alcool", "cafeina", "cigarro", "geral", "unhas", "vape"]);
  for (const p of PRESETS.filter((p) => !["cigarro", "unhas", "vape", "alcool", "cafeina"].includes(p.id))) {
    for (const m of p.marcos) {
      const b = beneficioDe(p.id, m.chave);
      // só a nota geral sobre formação de hábito pode aparecer fora do cigarro
      if (b) assert.equal(b.fonte.id, "lally", `${p.id}/${m.chave}`);
    }
  }
});

test("catálogo de hábitos: sem as afirmações removidas na revisão de conteúdo", () => {
  const proibidos =
    /cérebro|cerebro|hardware|reorganiza|recalibr|nicotina zero|cílios|cilios|capacidade pulmonar|se aproxima muito|igual ao de quem nunca|reset\b|90 dias.*sistema/i;
  for (const p of PRESETS) {
    for (const m of p.marcos) {
      assert.ok(!proibidos.test(m.corpo), `${p.id}/${m.chave}: ${m.corpo}`);
      assert.ok(!CERTEZA.test(semNegacao(m.corpo)), `${p.id}/${m.chave}: ${m.corpo}`);
    }
    // o mito dos 21 dias só pode aparecer negado, nunca afirmado
    for (const m of p.marcos.filter((x) => x.chave === "21d")) {
      assert.match(m.corpo, /número mágico/, `${p.id}/21d precisa negar o prazo universal`);
    }
    assert.ok(!proibidos.test(p.contexto), `contexto de ${p.id}`);
    assert.ok(!/72 ?h|72 horas|meia-vida/i.test(p.contexto), `contexto de ${p.id} traz prazo de eliminação`);
  }
});

test("fora do cigarro, nenhum texto de marco faz afirmação fisiológica nem cita fonte não verificada", () => {
  const fisiologico = /risco de|pulm|coração|cardíac|fígado|pressão arterial|circula|metabol|insulina|glicemia|oxigên/i;
  for (const p of PRESETS.filter((p) => p.id !== "cigarro")) {
    for (const m of p.marcos) {
      assert.ok(!fisiologico.test(m.corpo), `${p.id}/${m.chave}: ${m.corpo}`);
      assert.ok(!/segundo o (CDC|NHS)/.test(m.corpo), `${p.id}/${m.chave} cita fonte sem catálogo`);
    }
  }
});

test("no cigarro, todo texto que atribui a CDC/NHS tem o benefício correspondente no catálogo", () => {
  const cigarro = PRESETS.find((p) => p.id === "cigarro")!;
  const comAtribuicao = cigarro.marcos.filter((m) => /(CDC|NHS)/.test(m.corpo));
  assert.ok(comAtribuicao.length >= 8);
  for (const m of comAtribuicao) {
    assert.ok(beneficioDe("cigarro", m.chave), `${m.chave} cita fonte mas não está no catálogo`);
  }
  // e o inverso: todo benefício do catálogo aparece, com a mesma fonte, no corpo da etapa
  for (const chave of Object.keys(TODOS_OS_BENEFICIOS.cigarro)) {
    const m = cigarro.marcos.find((x) => x.chave === chave)!;
    assert.match(m.corpo, /CDC|NHS/, `${chave} deveria atribuir a fonte no corpo`);
  }
});

test("as afirmações do corpo não contradizem as da fonte (prazos conferidos na revisão)", () => {
  const c = (chave: string) => PRESETS.find((p) => p.id === "cigarro")!.marcos.find((m) => m.chave === chave)!.corpo;
  // o CDC põe o monóxido normalizado em "vários dias", não em 12 horas
  assert.ok(!/12 horas sem fumar.*monóxido/i.test(c("12h")) && !/monóxido/i.test(c("12h")));
  assert.match(c("3d"), /monóxido/);
  // o risco coronariano pela metade é de 3 a 6 anos no CDC — não em 1 ano
  assert.ok(!/pela metade/i.test(c("1a")));
  // AVC: "diminui", e não "igual ao de um não fumante"
  assert.ok(!/não fumante|nunca fumou/i.test(c("5a")));
  assert.match(c("15a"), /próximo ao de quem nunca fumou/);
});

test("etapa com fonte mostra a referência e o aviso de que não é garantia", () => {
  const etapas = etapasDoMarco("cigarro");
  const e = etapas.find((x) => x.chave === "1a")!;
  const r = conteudoDaEtapa({ tipo: "marco", presetId: "cigarro", etapa: e, proxima: etapas.find((x) => x.chave === "18m")! });
  assert.equal(r.beneficio.tipo, "fonte");
  if (r.beneficio.tipo === "fonte") {
    assert.equal(r.beneficio.fonte.id, "cdc");
    assert.equal(r.beneficio.aviso, AVISO_BENEFICIO);
    assert.match(r.beneficio.aviso, /sem garantia individual/);
  }
  assert.match(r.conquista, /1 ANO SEM FUMAR/);
  assert.match(r.proximoPasso, /Próxima etapa/);
});

test("hábito sem fonte cai numa mensagem factual — nunca numa afirmação de saúde", () => {
  const etapas = etapasDoMarco("acucar");
  const e = etapas.find((x) => x.chave === "30d")!;
  const r = conteudoDaEtapa({ tipo: "marco", presetId: "acucar", etapa: e, proxima: null });
  assert.equal(r.beneficio.tipo, "factual");
  assert.match(r.beneficio.texto, /constância/);
  assert.match(r.proximoPasso, /fim da trilha/);
});

test("tratamento: o conteúdo diz que o contador mede só tempo e nunca insinua dose ou resultado", () => {
  for (const e of etapasDoAcompanhamento()) {
    const r = conteudoDaEtapa({ tipo: "acompanhamento", categoria: "tratamento", etapa: e, proxima: null });
    assert.equal(r.beneficio.tipo, "factual", `${e.chave}: tratamento nunca ganha benefício`);
    const tudo = `${r.conquista} ${r.beneficio.texto} ${r.proximoPasso}`.toLowerCase();
    for (const proibida of ["melhora", "eficaz", "funcion", "curad", "resultado positivo", "em dia", "adesão", "tomou"]) {
      assert.ok(!tudo.includes(proibida), `${e.chave}: "${proibida}" em "${tudo}"`);
    }
    assert.match(r.beneficio.texto, /só o tempo desde o início/);
    assert.match(r.beneficio.texto, /não indica doses tomadas nem resultado/);
  }
});

test("outras categorias de acompanhamento: mensagem factual, sem saúde", () => {
  for (const cat of ["rotina", "projeto", "pessoal"]) {
    for (const e of etapasDoAcompanhamento()) {
      const r = conteudoDaEtapa({ tipo: "acompanhamento", categoria: cat, etapa: e, proxima: null });
      assert.equal(r.beneficio.tipo, "factual");
      assert.ok(!/saúde|risco|doença/i.test(r.beneficio.texto));
    }
  }
});

test("sono: conteúdo é sobre observar o padrão, nunca sobre dormir mais ou melhor", () => {
  for (const e of etapasDoSono()) {
    const r = conteudoDaEtapa({ tipo: "sono", etapa: e, proxima: null, noites: e.limiar });
    assert.equal(r.beneficio.tipo, "factual");
    const tudo = `${r.conquista} ${r.beneficio.texto}`.toLowerCase();
    for (const proibida of ["durma mais", "dormir mais", "dormir melhor", "mínimo", "recomendad", "ideal", "saudável", "oito horas"]) {
      assert.ok(!tudo.includes(proibida), `${e.chave}: "${proibida}" em "${tudo}"`);
    }
  }
  const sete = etapasDoSono().find((e) => e.chave === "n7")!;
  assert.match(conteudoDaEtapa({ tipo: "sono", etapa: sete, proxima: null }).beneficio.texto, /Sem metas/);
});

test("a nota sobre formação de hábito (21 dias) tem fonte, e some do corpo a promessa de 21 dias", () => {
  const b = beneficioDe("alcool", "21d");
  assert.equal(b?.fonte.id, "lally");
  assert.match(b?.texto ?? "", /18 a 254 dias/);
  assert.match(b?.texto ?? "", /mediana de 66/);
  assert.equal(chavesComBeneficio("alcool").includes("21d"), true);
});

test("a abertura da trilha nunca ganha benefício", () => {
  const etapas = etapasDoMarco("cigarro");
  const r = conteudoDaEtapa({ tipo: "marco", presetId: "cigarro", etapa: etapas[0], proxima: etapas[1] });
  assert.equal(r.beneficio.tipo, "factual");
  assert.match(r.conquista, /Você começou/);
});

test("só conteúdo com fonte se chama benefício — o resto nunca ganha esse título", () => {
  assert.equal(rotuloDoBeneficio("fonte"), "Benefício possível");
  assert.ok(!/benef/i.test(rotuloDoBeneficio("factual")));
  // e todo conteúdo de tratamento cai no rótulo que não promete nada
  for (const e of etapasDoAcompanhamento()) {
    const r = conteudoDaEtapa({ tipo: "acompanhamento", categoria: "tratamento", etapa: e, proxima: null });
    assert.ok(!/benef/i.test(rotuloDoBeneficio(r.beneficio.tipo)), e.chave);
  }
});

test("unhas: os benefícios das etapas vêm do tema, com fonte lida, e nenhum afirma recuperação nem prazo", () => {
  const etapas = ["1d", "7d", "10d", "14d", "30d"];
  for (const chave of etapas) {
    const b = beneficioDe("unhas", chave);
    assert.ok(b, chave);
    assert.equal(b.fonte.verificacao, "pagina lida", chave);
    assert.doesNotMatch(b.texto, /recuperad|cicatriz|curad|voltam ao normal|em \d+ dias/i, chave);
  }
  // 10 dias: a ressalva do tema (nenhuma fonte informa o prazo de recuperação) viaja com o benefício
  assert.match(beneficioDe("unhas", "10d")!.ressalva ?? "", /nenhuma informa quanto tempo/);
  // etapas sem benefício caem na mensagem factual, nunca num benefício inventado
  assert.equal(beneficioDe("unhas", "3d"), null);
  assert.equal(beneficioDe("unhas", "1a"), null);
});

test("vape, álcool e cafeína: o que costuma acontecer em cada fase vem da fonte, com o rótulo de fase e não de benefício", () => {
  for (const [preset, chave, fonte] of [
    ["vape", "3d", "nhs-abstinencia-nicotina"],
    ["vape", "7d", "cdc-vape"],
    ["alcool", "1d", "medlineplus-abstinencia-alcool"],
    ["cafeina", "2d", "medlineplus-cafeina"],
  ] as const) {
    const b = beneficioDe(preset, chave);
    assert.ok(b, `${preset}/${chave}`);
    assert.equal(b.fonte.id, fonte);
    assert.equal(b.fase, true, `${preset}/${chave} é fase, não ganho`);
    assert.equal(b.fonte.verificacao, "pagina lida");
  }
  assert.equal(rotuloDoBeneficio("fonte", true), "O que costuma acontecer nesta fase");
  assert.equal(rotuloDoBeneficio("fonte"), "Benefício possível");
});

test("álcool: toda etapa das primeiras horas e dias leva o aviso de emergência com o SAMU 192", () => {
  for (const chave of ["6h", "1d", "3d"]) {
    const b = beneficioDe("alcool", chave)!;
    assert.match(b.ressalva ?? "", /SAMU 192/, chave);
    assert.match(b.ressalva ?? "", /orientação médica/, chave);
  }
  for (const m of PRESETS.find((p) => p.id === "alcool")!.marcos.filter((x) => ["6h", "12h", "1d"].includes(x.chave))) {
    assert.match(m.corpo, /192/, m.chave);
  }
});
