import { test } from "node:test";
import assert from "node:assert/strict";
import { TEMAS, temaPorId } from "./catalogo.ts";
import { FONTES } from "./fontes.ts";
import { buscar } from "./indice.ts";
import { responderComConhecimento } from "./assistente.ts";
import { DIAGNOSTICO, INSTRUCAO_DE_DOSE, PROMESSAS, TELEFONE_ESTRANGEIRO, fontesDoTema } from "./validacao.ts";

const GERAIS = ["sono", "atividade-fisica", "cafeina", "higiene-bucal", "respiracao", "parar-de-fumar", "autocuidado", "terapia"];
const responder = (p: string) => responderComConhecimento(p, { autorizado: false });
const tudo = (id: string) => JSON.stringify(temaPorId(id));

test("os temas gerais existem, não têm marcos inventados e não prometem acompanhamento que o app não tem", () => {
  for (const id of GERAIS) {
    const t = temaPorId(id);
    assert.ok(t, id);
    assert.deepEqual(t.marcos, [], `${id}: marcos de 'dias' só existem onde há registro que os sustente`);
    assert.notEqual(t.rastreio.tipo, "episodios", id);
    assert.notEqual(t.rastreio.tipo, "medicamento", id);
  }
});

test("cada afirmação de benefício dos temas gerais cita fonte que existe, e a fonte foi lida por inteiro", () => {
  for (const id of GERAIS) {
    const t = temaPorId(id)!;
    for (const b of t.beneficios) {
      assert.ok(b.fontes.length > 0, `${id}/${b.id}`);
      for (const f of b.fontes) assert.ok(FONTES[f], `${id}/${b.id}: ${f}`);
    }
    for (const f of fontesDoTema(t, FONTES)) assert.equal(f.verificacao, "pagina lida", `${id}: ${f.id}`);
  }
});

test("nenhum tema geral promete, dá dose, diagnostica ou usa telefone de outro país", () => {
  for (const id of GERAIS) {
    const texto = tudo(id);
    assert.doesNotMatch(texto, PROMESSAS, id);
    assert.doesNotMatch(texto, INSTRUCAO_DE_DOSE, id);
    assert.doesNotMatch(texto, DIAGNOSTICO, id);
    assert.doesNotMatch(texto, TELEFONE_ESTRANGEIRO, id);
  }
});

test("temas de saúde mental e de risco trazem os números brasileiros de urgência, e nenhum tema traz dado pessoal", () => {
  const SEM_URGENCIA = ["higiene-bucal"];
  for (const id of GERAIS) {
    const t = temaPorId(id)!;
    const urgentes = t.sinaisDeAjuda.filter((s) => s.nivel === "urgencia").map((s) => s.texto).join(" ");
    if (!SEM_URGENCIA.includes(id)) assert.match(urgentes, /\b(192|188)\b/, id);
    assert.doesNotMatch(tudo(id), /\b\d+ ?mg\b.*(meu|minha)|caua|caual/i, id);
  }
});

test("sono: não inventa número de horas de sono (a fonte não traz)", () => {
  const t = temaPorId("sono")!;
  assert.doesNotMatch(JSON.stringify([t.descricao, t.beneficios, t.estrategias]), /\b\d+ ?(a \d+ )?horas de sono\b|\b(7|8|9) horas\b/i);
  const r = responder("quantas horas preciso dormir?")!;
  assert.ok(r);
  assert.match(r.texto, /não informa um número de horas/);
});

test("cafeína: a fonte não traz plano de redução, e o tema diz isso", () => {
  const t = temaPorId("cafeina")!;
  assert.match(t.limites.join(" "), /não traz um plano de redução/);
  const r = responder("quanta cafeína é demais por dia?")!;
  assert.ok(r);
  assert.match(r.texto, /400 mg/);
  assert.deepEqual(r.fontes.includes("medlineplus-cafeina"), true);
});

test("parar de fumar: o tema admite que as fontes não orientam sobre fissura, e o assistente não a inventa", () => {
  const t = temaPorId("parar-de-fumar")!;
  assert.match(t.limites.join(" "), /não trazem orientação sobre fissura/);
  const r = responder("quero fumar agora, me ajuda");
  assert.equal(r, null, "o motor de hábitos de sempre continua respondendo");
  const rb = responder("como faço quando bater a vontade de fumar?");
  if (rb) assert.match(rb.texto, /não trazem orientação sobre fissura/);
});

test("parar de fumar: os prazos são os das fontes e vêm como médias, não como previsão", () => {
  const t = temaPorId("parar-de-fumar")!;
  assert.match(t.descricao, /não previsões sobre você|não são previsões/);
  const r = responder("em quanto tempo o corpo começa a melhorar quando eu parar de fumar?")!;
  assert.ok(r);
  assert.match(r.texto, /médias de estudos/);
});

test("terapia: não descreve caminho de acesso no Brasil que não foi conferido, e o status é parcial", () => {
  const t = temaPorId("terapia")!;
  assert.equal(t.status, "parcial");
  assert.match(t.notaEditorial ?? "", /nenhuma fonte brasileira/i);
  // A nota editorial pode citar o SUS para dizer que NÃO foi lido; o conteúdo do tema não pode descrevê-lo.
  assert.doesNotMatch(JSON.stringify({ ...t, notaEditorial: undefined }), /\bSUS\b|\bCAPS\b|\bUBS\b/);
});

test("a busca acha os temas novos pelos nomes e pelas palavras que as pessoas usam", () => {
  const acha = (consulta: string, id: string) =>
    assert.equal(buscar(consulta, TEMAS)[0]?.tema.id, id, consulta);
  acha("insônia", "sono");
  acha("caminhada", "atividade-fisica");
  acha("café demais", "cafeina");
  acha("fio dental", "higiene-bucal");
  acha("exercício de respiração", "respiracao");
  acha("largar o cigarro", "parar-de-fumar");
  acha("saúde mental 5 passos", "autocuidado");
  acha("psicólogo", "terapia");
});

test("a pergunta sobre sono e humor continua indo para a comparação de registros, mesmo com o tema 'sono' no catálogo", () => {
  const r = responderComConhecimento("meu sono melhorou junto com o humor? tem relação?", { autorizado: false })!;
  assert.match(r.texto, /ligue “Assistente e saúde”/);
  assert.equal(r.temaId, null);
});

test("pergunta que o tema geral não cobre admite o limite quando é de medicamento/hábito e cede ao motor nos demais", () => {
  assert.equal(responder("qual a previsão do tempo?"), null);
  assert.ok(responder("escitalopram engorda quantos quilos em média?"));
});
