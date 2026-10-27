import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REGRAS_DE_SAUDE,
  linhaDeFontes,
  responderComConhecimento,
  secaoParaModelo,
  type DadosSaude,
  type DadosTratamento,
  type DadosUnhas,
} from "./assistente.ts";
import { DIAGNOSTICO, INSTRUCAO_DE_DOSE, PROMESSAS, TELEFONE_ESTRANGEIRO } from "./validacao.ts";

// Dados de TESTE, só aqui. O app não traz nenhum dado pessoal em código, seed ou fixture compartilhada.
const trat = (extra: Partial<DadosTratamento> = {}): DadosTratamento => ({
  nome: "Escitalopram",
  medicamentoId: "escitalopram",
  desdeInicio: { completos: 30, diaN: 31 },
  dose: { descricao: "15 mg", contagem: { completos: 3, diaN: 4 } },
  sequencia: 10,
  totalNaoTomou: 2,
  efeitos: [{ dia: "2026-10-09", descricao: "enjoo ao acordar" }],
  ...extra,
});
const unh = (extra: Partial<DadosUnhas> = {}): DadosUnhas => ({
  totalEpisodios: 2,
  totalDiasConfirmados: 12,
  sequencia: 4,
  diasDesdeReferencia: 4,
  referencia: "episodio",
  diasSemInformacao: 3,
  ...extra,
});
const COM: DadosSaude = { autorizado: true, tratamento: trat(), unhas: unh() };
const SEM: DadosSaude = { autorizado: false };

const responder = (p: string, d: DadosSaude = SEM, turno = 0) => responderComConhecimento(p, d, { turno });

/** Regras que TODA resposta do assistente tem de cumprir, venha de onde vier. */
function regrasGerais(texto: string, contexto = "") {
  assert.doesNotMatch(texto, PROMESSAS, `promessa: ${contexto}`);
  assert.doesNotMatch(texto, INSTRUCAO_DE_DOSE, `instrução de dose: ${contexto}`);
  assert.doesNotMatch(texto, DIAGNOSTICO, `diagnóstico: ${contexto}`);
  assert.doesNotMatch(texto, TELEFONE_ESTRANGEIRO, `telefone estrangeiro: ${contexto}`);
  assert.doesNotMatch(texto, /\b(melhorou|piorou|ajudou|funcionou) (seu|sua|o seu|a sua)\b/i, `causa: ${contexto}`);
  assert.doesNotMatch(texto, /graças (ao|à)|por causa d[oa] (escitalopram|medicamento|rem[eé]dio)/i, `causa: ${contexto}`);
}

/* --------------------------- as seis perguntas do briefing ------------------ */

test("1) '10 dias tomando escitalopram 15 mg. O que já melhorou?' — não afirma melhora, mostra o que foi registrado e cita a fonte", () => {
  const p = "Estou há 10 dias tomando escitalopram 20 mg. O que já melhorou?";
  const r = responder(p, COM)!;
  assert.ok(r);
  assert.equal(r.temaId, "escitalopram");
  assert.equal(r.usouRegistros, true);
  assert.match(r.texto, /O app não sabe o que melhorou/);
  assert.match(r.texto, /Pelos seus registros: o tratamento \(Escitalopram\) começou há 30 dias completos/);
  assert.match(r.texto, /dose informada atual é 15 mg, há 3 dias completos/);
  assert.match(r.texto, /10 dias seguidos sem esquecimento marcado/);
  assert.match(r.texto, /2 esquecimentos marcados/);
  assert.match(r.texto, /Efeitos que você anotou: enjoo ao acordar \(09\/10\/2026\)/);
  assert.match(r.texto, /Fontes: .*Novartis.*NHS.*MedlinePlus/);
  assert.match(r.texto, /Se algo piorou ou preocupa, fale com o seu médico/);
  regrasGerais(r.texto, "1 com registros");
});

test("1b) sem permissão, a mesma pergunta NÃO usa os registros e explica como permitir", () => {
  const r = responder("Estou há 10 dias tomando escitalopram 20 mg. O que já melhorou?", SEM)!;
  assert.equal(r.usouRegistros, false);
  assert.doesNotMatch(r.texto, /Pelos seus registros/);
  assert.doesNotMatch(r.texto, /30 dias|25 |enjoo/);
  assert.match(r.texto, /ligue “Assistente e saúde” no Perfil/);
  regrasGerais(r.texto, "1 sem permissão");
});

test("2) 'Esqueci de registrar ontem. Perdi minha sequência?' — separa registro de tratamento e não ameaça", () => {
  const r = responder("Esqueci de registrar ontem. Perdi minha sequência?", COM)!;
  assert.ok(r);
  assert.match(r.texto, /Você não perdeu o tratamento nem o histórico/);
  assert.match(r.texto, /presume que você tomou/);
  assert.match(r.texto, /Pelos seus registros:/);
  assert.doesNotMatch(r.texto, /perdeu sua sequência|volte a zero|recomece do zero/i);
  regrasGerais(r.texto, "2 com registros");

  const sem = responder("Esqueci de registrar ontem. Perdi minha sequência?", SEM)!;
  assert.ok(sem, "mesmo sem permissão a pessoa recebe a resposta geral");
  assert.match(sem.texto, /presume que você tomou/);
  assert.equal(sem.usouRegistros, false);
  regrasGerais(sem.texto, "2 sem permissão");
});

test("3) 'Mudei a dose há 3 dias, mas comecei há um mês.' — duas datas separadas, nada recomeça, sem previsão nova", () => {
  const r = responder("Mudei a dose há 3 dias, mas comecei há um mês.", COM)!;
  assert.match(r.texto, /duas datas separadas/);
  assert.match(r.texto, /nada é apagado e nada recomeça/);
  assert.match(r.texto, /não calcula nova previsão/);
  assert.match(r.texto, /Pelos seus registros: o tratamento \(Escitalopram\) começou há 30 dias completos; a dose informada atual é 15 mg, há 3 dias completos/);
  regrasGerais(r.texto, "3 com registros");

  const sem = responder("Mudei a dose há 3 dias, mas comecei há um mês.", SEM)!;
  assert.match(sem.texto, /Mudanças de dose são decisão de quem prescreve/);
  assert.match(sem.texto, /não calcula nenhuma previsão nova/);
  assert.doesNotMatch(sem.texto, /15 mg/);
  regrasGerais(sem.texto, "3 sem permissão");
});

test("4) 'Estou pior desde que comecei.' — orienta procurar ajuda, com números do Brasil, e NUNCA depende de permissão", () => {
  for (const d of [COM, SEM]) {
    const r = responder("Estou pior desde que comecei.", d)!;
    assert.ok(r, d.autorizado ? "com permissão" : "sem permissão");
    assert.match(r.texto, /192 \(SAMU\)/);
    assert.match(r.texto, /188 \(CVV/);
    assert.match(r.texto, /não consegue saber se é o medicamento/);
    assert.doesNotMatch(r.texto, /parabéns|continue assim|siga firme|vai passar|é normal|adaptação/i);
    regrasGerais(r.texto, `4 ${d.autorizado}`);
  }
  const com = responder("Estou pior desde que comecei.", COM)!;
  assert.match(com.texto, /Pelos seus registros:/, "com permissão, os registros ajudam a levar ao médico");
});

test("5) 'Roí uma unha hoje. Perdi todo o progresso?' — acolhe, não apaga nada, cita os registros", () => {
  const r = responder("Roí uma unha hoje. Perdi todo o progresso?", COM)!;
  assert.equal(r.temaId, "unhas");
  assert.match(r.texto, /Não\. Tudo que você registrou continua no histórico/);
  assert.match(r.texto, /nada é apagado/);
  assert.match(r.texto, /Pelos seus registros: 4 dias desde o último episódio informado; 4 dias seguidos com “hoje não roí” confirmado; 12 dias confirmados no total; 2 episódios registrados; 3 dias sem informação/);
  assert.doesNotMatch(r.texto, /voltou a zero|do zero|falhou|fracasso|culpa/i);
  regrasGerais(r.texto, "5 com registros");

  const sem = responder("Roí uma unha hoje. Perdi todo o progresso?", SEM)!;
  assert.match(sem.texto, /Não\. Tudo que você registrou continua no histórico/);
  assert.doesNotMatch(sem.texto, /Pelos seus registros/);
  regrasGerais(sem.texto, "5 sem permissão");
});

test("6) 'Por que vale a pena parar de roer unhas?' — benefícios com fonte, sem prometer recuperação", () => {
  const r = responder("Por que vale a pena parar de roer unhas?")!;
  assert.equal(r.temaId, "unhas");
  assert.match(r.texto, /Segundo AAD e TLC/);
  assert.match(r.texto, /As fontes não prometem prazo de recuperação/);
  assert.match(r.texto, /Fontes: American Academy of Dermatology \(AAD\), 04\/12\/2024; The TLC Foundation for BFRBs, 28\/03\/2025\./);
  assert.doesNotMatch(r.texto, /se recuperam em|ficam recuperadas|sem risco/i);
  regrasGerais(r.texto, "6");
});

/* ------------------------------ comportamento geral ------------------------- */

test("sem permissão, nenhum número pessoal sai em NENHUMA resposta, nem as de unhas nem as de medicamento", () => {
  for (const p of [
    "Estou há 10 dias tomando escitalopram 20 mg. O que já melhorou?",
    "Roí uma unha hoje. Perdi todo o progresso?",
    "Esqueci de registrar ontem. Perdi minha sequência?",
    "Mudei a dose há 3 dias, mas comecei há um mês.",
    "Estou pior desde que comecei.",
    "escitalopram e efeitos colaterais",
  ]) {
    const r = responder(p, SEM);
    if (!r) continue;
    assert.equal(r.usouRegistros, false, p);
    assert.doesNotMatch(r.texto, /Pelos seus registros|enjoo ao acordar|12 dias confirmados/, p);
  }
});

test("sem tema e sem intenção conhecida, devolve null (quem responde é o motor de hábitos de sempre)", () => {
  assert.equal(responder("quero fumar agora, me ajuda", COM), null);
  assert.equal(responder("oi", COM), null);
  assert.equal(responder("qual a previsão do tempo?", COM), null);
});

test("erro de digitação PERGUNTA em vez de responder como se fosse o medicamento", () => {
  const r = responder("tomo exscitalopram, para que serve?")!;
  assert.match(r.texto, /Você quis dizer “Escitalopram”\?/);
  assert.equal(r.temaId, null);
  assert.deepEqual(r.fontes, []);
});

test("citalopram: o assistente diz que é outro medicamento e não usa o conteúdo do escitalopram", () => {
  const r = responder("tomo citalopram há dois meses, posso beber álcool?")!;
  assert.match(r.texto, /Citalopram não é o mesmo medicamento que escitalopram/);
  assert.match(r.texto, /bula do seu medicamento/);
  assert.doesNotMatch(r.texto, /A bula brasileira diz que o escitalopram/);
});

test("pergunta sobre o tema que o catálogo não cobre: admite o limite em vez de completar com palpite", () => {
  const r = responder("escitalopram engorda quantos quilos em média?")!;
  assert.ok(r);
  assert.match(r.texto, /Não tenho informação verificada sobre isso/);
  assert.match(r.texto, /bula do seu medicamento e o profissional/);
  regrasGerais(r.texto, "limite");
});

test("quem permitiu mas ainda não registrou nada é avisado de que não há números, em vez de inventados", () => {
  const r = responder("Estou há 10 dias tomando escitalopram. O que já melhorou?", { autorizado: true, tratamento: null })!;
  assert.match(r.texto, /ainda não registrou nenhum acompanhamento de Escitalopram/);
  assert.doesNotMatch(r.texto, /Pelos seus registros/);
  assert.equal(r.usouRegistros, false);
});

test("medicamento diferente do que a pessoa acompanha não recebe os números do tratamento", () => {
  const dados: DadosSaude = { autorizado: true, tratamento: trat({ medicamentoId: "outro", nome: "paracetamol" }) };
  const r = responder("Estou há 10 dias tomando escitalopram. O que já melhorou?", dados)!;
  assert.doesNotMatch(r.texto, /Pelos seus registros: o tratamento \(paracetamol\)/);
});

test("sono e humor: descreve o que há, exige base e nunca afirma causa", () => {
  const com: DadosSaude = {
    autorizado: true,
    comparacaoSono: "A média de qualidade de sono registrada nesta semana foi maior (4,0 contra 3,0 na semana anterior; 7 dias nesta semana contra 7 na anterior).",
    cruzamentoHumorSono: null,
  };
  const r = responder("meu sono melhorou junto com o humor? tem relação?", com)!;
  assert.match(r.texto, /foi maior \(4,0 contra 3,0/);
  assert.match(r.texto, /não mostram que uma causa a outra/);
  regrasGerais(r.texto, "sono");

  const sem = responder("meu sono melhorou junto com o humor? tem relação?", SEM)!;
  assert.match(sem.texto, /ligue “Assistente e saúde”/);
  assert.equal(sem.usouRegistros, false);

  const vazio = responder("meu sono melhorou junto com o humor? tem relação?", { autorizado: true })!;
  assert.match(vazio.texto, /ainda não registrou sono e humor o bastante/);
});

test("o escitalopram nunca 'melhorou o sono': a resposta descreve a semana e separa causa", () => {
  const dados: DadosSaude = {
    autorizado: true,
    tratamento: trat(),
    comparacaoSono: "A média de qualidade de sono registrada nesta semana foi maior (4,0 contra 3,0 na semana anterior; 7 dias nesta semana contra 7 na anterior).",
  };
  const r = responder("Estou há 10 dias tomando escitalopram. O que já melhorou?", dados)!;
  assert.match(r.texto, /qualidade de sono registrada nesta semana foi maior/);
  assert.match(r.texto, /descreve os seus registros; não mostra a causa/);
  assert.doesNotMatch(r.texto, /escitalopram (melhorou|ajudou)/i);
});

test("as aberturas variam com o turno nas respostas montadas, e as de alerta e de FAQ não são trocadas", () => {
  const aberturas = new Set<string>();
  for (let turno = 0; turno < 6; turno++) {
    const r = responder("estratégias para ocupar as mãos quando fico entediado roendo unha", SEM, turno)!;
    assert.ok(r);
    aberturas.add(r.texto.split("\n")[0]);
  }
  assert.ok(aberturas.size >= 2, "a mesma abertura em toda resposta repetiria o assistente");
  const a = responder("Estou pior desde que comecei.", COM, 0)!.texto;
  const b = responder("Estou pior desde que comecei.", COM, 5)!.texto;
  assert.equal(a, b, "a resposta de segurança é fixa");
});

test("linha de fontes: órgão e data, sem repetir e ignorando id desconhecido", () => {
  assert.equal(linhaDeFontes(["cdc", "cdc", "inexistente"]), "Fontes: CDC (EUA), 15/05/2024.");
  assert.equal(linhaDeFontes([]), "");
  assert.equal(linhaDeFontes(["nhs-sono"]), "Fontes: NHS — Every Mind Matters (Reino Unido).");
});

/* ------------------------------ prompt do modelo ---------------------------- */

test("as regras de saúde SEMPRE entram no prompt e cobrem os pontos do briefing", () => {
  for (const trecho of [
    /só com base no bloco "CONHECIMENTO VERIFICADO"/,
    /CITE a fonte/,
    /Observação não é causa/,
    /não recomende começar, aumentar, reduzir, suspender nem compensar dose/,
    /Nunca confunda escitalopram com citalopram/,
    /a falta de registro NÃO prova/,
    /não ameace a pessoa com "perder a sequência"/,
    /Não diagnostique/,
    /SAMU 192, CVV 188/,
    /não permitiu que você leia os registros/,
  ]) {
    assert.match(REGRAS_DE_SAUDE, trecho);
  }
  assert.doesNotMatch(REGRAS_DE_SAUDE, TELEFONE_ESTRANGEIRO);
});

test("o trecho do modelo traz SÓ o conhecimento da pergunta — não o tema inteiro", () => {
  const s = secaoParaModelo("posso beber álcool tomando escitalopram?", SEM);
  assert.match(s, /CONHECIMENTO VERIFICADO — Escitalopram/);
  assert.match(s, /não potencializa os efeitos do álcool/);
  assert.doesNotMatch(s, /Por quanto tempo vou tomar/, "perguntas sem relação ficam de fora");
  assert.doesNotMatch(s, /Escitalopram e citalopram são a mesma coisa/);
  assert.match(s, /REGISTROS DA PESSOA: não disponíveis/);
  assert.ok(s.length < 5000, `prompt enxuto (${s.length})`);
});

test("sem tema reconhecido, NADA de saúde vai ao modelo além das regras", () => {
  const s = secaoParaModelo("me ajuda a organizar meu dia", COM);
  assert.equal(s, REGRAS_DE_SAUDE);
  assert.doesNotMatch(s, /Pelos seus registros|15 mg|enjoo/);
});

test("com permissão, o modelo recebe só os registros do tema da pergunta", () => {
  const s = secaoParaModelo("estou há 10 dias tomando escitalopram, o que melhorou?", COM);
  assert.match(s, /REGISTROS DA PESSOA \(ela permitiu o uso/);
  assert.match(s, /dose informada atual é 15 mg/);
  assert.doesNotMatch(s, /episódio|hoje não roí/, "os registros de unhas não vão junto");

  const u = secaoParaModelo("roí uma unha hoje", COM);
  assert.match(u, /hoje não roí/);
  // as REGRAS citam o escitalopram de propósito ("nunca confunda..."); o que não pode ir é o CONTEÚDO dele
  const doTema = u.slice(u.indexOf("CONHECIMENTO VERIFICADO —"));
  assert.doesNotMatch(doTema, /15 mg|escitalopram|enjoo/i);
});

test("sem permissão, o modelo não recebe registro nenhum, e é instruído a não citar números", () => {
  const s = secaoParaModelo("estou há 10 dias tomando escitalopram, o que melhorou?", SEM);
  // os limites do tema falam de dose em geral, mas nenhum valor nem dado da pessoa vai junto
  assert.doesNotMatch(s, /d+ ?mg|dose informada atual|enjoo/);
  assert.match(s, /Não cite números dela/);
});

test("palavras de alerta no prompt colocam o sinal de ajuda no contexto do modelo", () => {
  const s = secaoParaModelo("estou pior desde que comecei o escitalopram", SEM);
  assert.match(s, /\(SINAL DE AJUDA\)/);
  assert.match(s, /192/);
});

test("defesa em profundidade: mesmo COM dados entregues, autorizado=false não usa nenhum registro (nem na resposta, nem no prompt)", () => {
  const vazado: DadosSaude = {
    autorizado: false,
    tratamento: trat(),
    unhas: unh(),
    comparacaoSono: "A média de qualidade de sono registrada nesta semana foi maior (4,0 contra 3,0).",
    cruzamentoHumorSono: "Nos 4 dias em que você registrou sono de qualidade 4 ou 5, o humor médio registrado foi 4,0.",
  };
  for (const p of [
    "Estou há 10 dias tomando escitalopram 20 mg. O que já melhorou?",
    "Esqueci de registrar ontem. Perdi minha sequência?",
    "Mudei a dose há 3 dias, mas comecei há um mês.",
    "Estou pior desde que comecei.",
    "Roí uma unha hoje. Perdi todo o progresso?",
    "meu sono melhorou junto com o humor? tem relação?",
  ]) {
    const r = responderComConhecimento(p, vazado);
    if (r) {
      assert.equal(r.usouRegistros, false, p);
      assert.doesNotMatch(r.texto, /Pelos seus registros|15 mg|enjoo ao acordar|12 dias confirmados|4,0 contra 3,0|humor médio registrado/, p);
    }
    const prompt = secaoParaModelo(p, vazado);
    assert.doesNotMatch(prompt, /dose informada atual|enjoo ao acordar|hoje não roí” confirmado|4,0 contra 3,0|humor médio registrado/, `prompt: ${p}`);
  }
});
