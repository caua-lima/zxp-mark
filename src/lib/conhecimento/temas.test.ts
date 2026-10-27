import { test } from "node:test";
import assert from "node:assert/strict";
import { TEMAS, temaPorId } from "./catalogo.ts";
import { FONTES } from "./fontes.ts";
import { fontesDoTema, validarTema } from "./validacao.ts";
import { buscar, reconhecer, selecionar } from "./indice.ts";

/* ------------------- regras que valem para TODOS os temas ------------------ */

test("todo tema do catálogo passa na validação editorial", () => {
  assert.ok(TEMAS.length > 0);
  const problemas = TEMAS.flatMap((t) => validarTema(t, { fontes: FONTES }));
  assert.deepEqual(problemas, []);
});

test("ids dos temas são únicos e todo tema tem fontes que existem e foram lidas ou sinalizadas", () => {
  const ids = TEMAS.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const t of TEMAS) {
    const fs = fontesDoTema(t, FONTES);
    assert.ok(fs.length > 0, `${t.id} sem fontes`);
    const soResumo = fs.some((f) => f.verificacao !== "pagina lida");
    if (soResumo) assert.equal(t.status, "parcial", `${t.id} usa fonte por resumo e precisa estar "parcial"`);
  }
});

test("nenhum tema se declara revisado por profissional (nenhuma revisão real aconteceu)", () => {
  for (const t of TEMAS) assert.notEqual(t.status, "revisado-por-profissional", t.id);
});

test("busca acha cada tema pelo próprio nome e pelos nomes alternativos", () => {
  for (const t of TEMAS) {
    assert.equal(buscar(t.titulo, TEMAS)[0]?.tema.id, t.id, `título de ${t.id}`);
    for (const n of t.nomesAlternativos) {
      const r = buscar(n, TEMAS)[0];
      assert.equal(r?.tema.id, t.id, `"${n}" → ${r?.tema.id}, esperado ${t.id}`);
    }
  }
});

/* --------------------------------- unhas ----------------------------------- */

const unhas = temaPorId("unhas")!;

test("unhas: reconhece 'roer unha', 'morder unhas' e 'onicofagia', e as frases ditas do jeito que a pessoa fala", () => {
  for (const f of [
    "quero parar de roer unha",
    "roer unhas",
    "morder unhas",
    "onicofagia",
    "Roí uma unha hoje",
    "estou mordendo as unhas sem perceber",
    "minhas unhas estão feias de tanto roer",
    "eu roo as unhas quando estudo",
  ]) {
    const r = reconhecer(f, TEMAS);
    assert.equal(r?.tipo, "exato", f);
    assert.equal(r && "tema" in r ? r.tema.id : null, "unhas", f);
  }
});

test("unhas: não reconhece frases que só têm 'unha' ou só 'roer' sem relação", () => {
  assert.equal(reconhecer("preciso cortar a unha do gato", TEMAS), null);
  assert.equal(reconhecer("vou roer um osso", TEMAS), null);
});

test("unhas: os marcos são 1, 3, 7, 10, 14 e 30 dias, e cada um tem versão forte e fraca", () => {
  assert.deepEqual(unhas.marcos.map((m) => m.limiar), [1, 3, 7, 10, 14, 30]);
  for (const m of unhas.marcos) {
    assert.match(m.titulo, /sem roer, conforme seus registros/);
    assert.match(m.tituloSemRegistro, /desde o início informado/);
    assert.notEqual(m.titulo, m.tituloSemRegistro);
    assert.ok(m.acoes.length > 0 && !m.acoes.includes("nenhuma"), `${m.chave} precisa de uma ação simples`);
  }
});

test("unhas: o marco de 10 dias não promete recuperação e pergunta o que a pessoa percebeu", () => {
  const m = unhas.marcos.find((x) => x.chave === "10d")!;
  assert.match(m.texto, /conforme seus registros|registrados/);
  assert.match(m.texto, /Não há prazo comprovado/);
  assert.match(m.texto, /O que você percebeu até aqui\?/);
  assert.doesNotMatch(m.texto, /recuperad|se recuperam|cicatriz/i);
  assert.ok(m.acoes.includes("registrar-como-estou") && m.acoes.includes("registrar-gatilho"));
});

test("unhas: nenhum texto afirma que as unhas se recuperaram, que a infecção acabou ou que há prazo", () => {
  const tudo = JSON.stringify(unhas);
  for (const proibido of [
    /unhas (est[aã]o|ficaram|j[aá] est[aã]o) recuperad/i,
    /risco de infec[cç][aã]o (acabou|passou|zerou)/i,
    /(em|após|depois de) \d+ dias? (as )?unhas (se )?(recuper|cicatriz)/i,
    /sem risco/i,
  ]) {
    assert.doesNotMatch(tudo, proibido);
  }
});

test("unhas: o app declara que não diagnostica, que falta de registro não prova nada e que não há prazo", () => {
  const limites = unhas.limites.join(" ");
  assert.match(limites, /não diagnostica ansiedade, TOC/);
  assert.match(limites, /Não ter registro não prova/);
  assert.match(limites, /não informa quanto tempo/);
  assert.match(limites, /não são prazos comprovados/);
});

test("unhas: a fonte inicial do briefing (AAD) sustenta as estratégias da AAD, e a nota editorial admite o que ficou de fora", () => {
  const aad = FONTES["aad-unhas"];
  assert.equal(aad.url, "https://www.aad.org/public/everyday-care/nail-care-secrets/basics/stop-biting-nails");
  assert.equal(aad.verificacao, "pagina lida");
  for (const id of ["unhas-curtas", "esmalte-amargo", "cobrir", "ocupar-maos", "gatilhos", "gradual"]) {
    const e = unhas.estrategias.find((x) => x.id === id)!;
    assert.ok(e.fontes?.includes("aad-unhas"), `${id} deveria citar a AAD`);
  }
  assert.match(unhas.notaEditorial ?? "", /Nenhuma informa recuperação/);
  assert.match(unhas.notaEditorial ?? "", /503/);
});

test("unhas: perguntas do briefing caem na resposta certa", () => {
  const sel = (q: string) => selecionar(unhas, q).faq[0]?.id;
  assert.equal(sel("Por que vale a pena parar de roer unhas?"), "por-que-parar");
  assert.equal(sel("Roí uma unha hoje. Perdi todo o progresso?"), "perdi-progresso");
  assert.equal(sel("já estou há dias sem roer, minhas unhas já se recuperaram?"), "ja-recuperou");
  assert.equal(sel("roer unha é sinal de ansiedade?"), "sinal-de-ansiedade");
});

test("unhas: 'perdi o progresso?' tranquiliza sem apagar nem prometer, e a resposta sobre recuperação admite o limite", () => {
  const perdi = unhas.faq.find((f) => f.id === "perdi-progresso")!.resposta;
  assert.match(perdi, /Não\./);
  assert.match(perdi, /nada é apagado/);
  const rec = unhas.faq.find((f) => f.id === "ja-recuperou")!.resposta;
  assert.match(rec, /O app não consegue dizer isso/);
  assert.match(rec, /não informam quanto tempo/);
});

test("unhas: o CVV é citado com o número brasileiro", () => {
  const sinais = unhas.sinaisDeAjuda.map((s) => s.texto).join(" ");
  assert.match(sinais, /CVV atende pelo 188/);
});

/* ------------------------------ escitalopram ------------------------------ */

const esc = temaPorId("escitalopram")!;

test("escitalopram: reconhece o nome, o composto e a marca; sugere (sem assumir) em erro de digitação", () => {
  for (const f of ["tomo escitalopram", "oxalato de escitalopram 20 mg", "Lexapro", "Escitalopram"]) {
    const r = reconhecer(f, TEMAS);
    assert.equal(r?.tipo, "exato", f);
    assert.equal(r && "tema" in r ? r.tema.id : null, "escitalopram", f);
  }
  const typo = reconhecer("tomo exscitalopram", TEMAS);
  assert.equal(typo?.tipo, "incerto");
  assert.equal(typo && "sugestao" in typo ? typo.sugestao : null, "escitalopram");
});

test("escitalopram: citalopram é OUTRO medicamento e nunca cai neste tema", () => {
  const r = reconhecer("tomo citalopram há dois meses", TEMAS);
  assert.equal(r?.tipo, "outro-medicamento");
  assert.ok(!buscar("citalopram", TEMAS).some((x) => x.tema.id === "escitalopram"));
  const faq = esc.faq.find((f) => f.id === "citalopram")!;
  assert.match(faq.resposta, /medicamentos diferentes/);
  assert.match(faq.resposta, /só tem conteúdo sobre o escitalopram/);
});

test("escitalopram: os marcos são dias 1, 3, 7, 10, 14, 21, 30, 42 e 60", () => {
  assert.deepEqual(esc.marcos.map((m) => m.limiar), [1, 3, 7, 10, 14, 21, 30, 42, 60]);
  for (const m of esc.marcos) {
    assert.match(m.tituloSemRegistro, /de tratamento$/);
    assert.ok(m.acoes.length > 0 && !m.acoes.includes("nenhuma"), m.chave);
  }
});

test("escitalopram: o marco de 10 dias (modelo presumido) diz 'conforme você informou' e não promete resposta", () => {
  const m = esc.marcos.find((x) => x.chave === "10d")!;
  assert.equal(m.titulo, "10 dias seguidos sem esquecer");
  assert.equal(
    m.texto,
    "Você não registrou esquecimento em 10 dias seguidos: conforme você informou, tomou todos os dias. O efeito do escitalopram pode levar várias semanas; este marco, sozinho, não determina sua resposta ao tratamento. Como ficaram seu humor, sono e bem-estar nesse período?"
  );
  assert.deepEqual(m.acoes, ["registrar-como-estou", "ver-historico"]);
  assert.equal(m.tituloSemRegistro, "10 dias de tratamento");
});

test("escitalopram: nenhuma das afirmações proibidas aparece em lugar nenhum", () => {
  const tudo = JSON.stringify(esc);
  for (const proibido of [
    /serotonina (est[aá] )?normaliz/i,
    /voc[eê] j[aá] deveria/i,
    /20 ?mg funciona mais r[aá]pid/i,
    /\d+ ?% (do tratamento )?conclu/i,
    /precisa continuar para n[aã]o perder/i,
    /perder (a )?sua sequ[eê]ncia/i,
    /\b(aumente|reduza|suspenda) a dose\b/i,
    /\bdose recomendada\b/i,
    /tudo isso [eé] (normal|adapta[cç][aã]o)/i,
  ]) {
    assert.doesNotMatch(tudo, proibido);
  }
});

test("escitalopram: nenhuma dose nem dado pessoal mora no catálogo", () => {
  const tudo = JSON.stringify(esc);
  // A dose é DADO DO USUÁRIO: o catálogo não cita nenhum valor, nem como exemplo.
  const mencoes = tudo.match(/\d+ ?mg/gi) ?? [];
  assert.deepEqual(mencoes, [], `menções a dose no catálogo: ${mencoes.join(", ")}`);
  assert.doesNotMatch(tudo, /@|senha|cpf/i);
  assert.match(esc.limites.join(" "), /dado do seu acompanhamento/);
});

test("escitalopram: esquecimento de dose segue a bula brasileira e não calcula compensação", () => {
  const f = esc.faq.find((x) => x.id === "esqueci-de-tomar")!;
  assert.match(f.resposta, /até antes de deitar/);
  assert.match(f.resposta, /ignore a dose esquecida/);
  assert.match(f.resposta, /Não tome em dobro/);
  assert.match(f.resposta, /O app não calcula compensações/);
  assert.deepEqual(f.fontes, ["bula-escitalopram-br"]);
});

test("escitalopram: 'esqueci um dia' separa o esquecimento do tratamento e não ameaça a sequência", () => {
  const f = esc.faq.find((x) => x.id === "esqueci-de-registrar")!;
  assert.match(f.resposta, /não perdeu o tratamento nem o histórico/i);
  assert.match(f.resposta, /presume que você tomou/);
  assert.match(f.resposta, /Esqueci um dia/);
  assert.match(f.resposta, /não é falha/);
});

test("escitalopram: 'mudei a dose' mantém as duas datas separadas e não recalcula previsão", () => {
  const f = esc.faq.find((x) => x.id === "mudei-a-dose")!;
  assert.match(f.resposta, /duas datas separadas/);
  assert.match(f.resposta, /nada é apagado e nada recomeça/);
  assert.match(f.resposta, /não calcula nova previsão/);
});

test("escitalopram: 'estou pior' orienta procurar ajuda, com números do Brasil, e não normaliza o sintoma", () => {
  const f = esc.faq.find((x) => x.id === "pior-desde-que-comecei")!;
  assert.match(f.resposta, /192 \(SAMU\)/);
  assert.match(f.resposta, /188 \(CVV/);
  assert.match(f.resposta, /não consegue saber se é o medicamento/);
  assert.doesNotMatch(f.resposta, /normal|adapta[cç][aã]o|vai passar/i);
  assert.ok(esc.sinaisDeAjuda.some((s) => s.nivel === "urgencia" && /192/.test(s.texto) && /188/.test(s.texto)));
});

test("escitalopram: os cartões que citam fontes ligam o marco às afirmações educativas", () => {
  for (const m of esc.marcos) {
    if (/bula|NHS|MedlinePlus/.test(m.texto)) {
      assert.ok((m.afirmacoes?.length ?? 0) > 0, `${m.chave} cita fonte e precisa de afirmacoes`);
    }
  }
});

test("escitalopram: a nota editorial admite o que não foi lido e que não houve revisão profissional", () => {
  assert.match(esc.notaEditorial ?? "", /HSE .*403/);
  assert.match(esc.notaEditorial ?? "", /Bulário Eletrônico da Anvisa não foi consultado/);
  assert.match(esc.notaEditorial ?? "", /Não houve revisão por médico ou farmacêutico/);
  assert.equal(esc.rastreio.tipo, "medicamento");
});

test("perguntas do briefing sobre escitalopram caem na resposta certa", () => {
  const sel = (q: string) => selecionar(esc, q).faq[0]?.id;
  assert.equal(sel("Estou há 10 dias tomando escitalopram 20 mg. O que já melhorou?"), "dez-dias-o-que-melhorou");
  assert.equal(sel("Esqueci de registrar ontem. Perdi minha sequência?"), "esqueci-de-registrar");
  assert.equal(sel("Mudei a dose há 3 dias, mas comecei há um mês."), "mudei-a-dose");
  assert.equal(sel("Estou pior desde que comecei."), "pior-desde-que-comecei");
  assert.equal(sel("esqueci de tomar hoje de manhã, o que eu faço?"), "esqueci-de-tomar");
  assert.equal(selecionar(esc, "Estou pior desde que comecei.").alerta, true);
});
