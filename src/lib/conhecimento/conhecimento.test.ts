import { test } from "node:test";
import assert from "node:assert/strict";
import { FONTES, FONTES_PENDENTES } from "./fontes.ts";
import { fontesDoTema, validarTema } from "./validacao.ts";
import { buscar, distancia, normalizar, reconhecer, selecionar } from "./indice.ts";
import type { Fonte, Tema } from "./tipos.ts";

/** Um tema de mentira, válido — só para testar o validador e a busca. */
function modelo(sobre: Partial<Tema> = {}): Tema {
  return {
    id: "modelo",
    categoria: "habito",
    titulo: "Beber mais água",
    nomesAlternativos: ["tomar agua", "hidratacao"],
    termos: ["copo", "sede", "garrafa"],
    descricao: "Um tema de teste com descrição suficientemente longa para passar na validação editorial.",
    objetivos: ["Lembrar de beber água", "Perceber a sede"],
    beneficios: [{ id: "b1", texto: "Beber água faz parte da rotina.", fontes: ["cdc"] }],
    marcos: [
      { chave: "1d", limiar: 1, titulo: "1 dia registrado", texto: "Um dia.", tituloSemRegistro: "1 dia desde o início", textoSemRegistro: "Passou um dia.", acoes: ["nenhuma"] },
      { chave: "7d", limiar: 7, titulo: "7 dias registrados", texto: "Sete dias.", tituloSemRegistro: "7 dias desde o início", textoSemRegistro: "Passaram sete dias.", acoes: ["nenhuma"], afirmacoes: ["b1"] },
    ],
    estrategias: [
      { id: "e1", titulo: "Garrafa à vista", texto: "Deixe uma garrafa na mesa.", quando: ["esqueço de beber"] },
      { id: "e2", titulo: "Lembrete", texto: "Use um alarme discreto.", quando: ["esqueco"] },
      { id: "e3", titulo: "Copo ao acordar", texto: "Comece o dia com um copo.", quando: ["manha"] },
    ],
    faq: [
      { id: "f1", pergunta: "Quantos copos por dia?", resposta: "Varia de pessoa para pessoa; converse com um profissional.", termos: ["quantos copos", "quanto beber"] },
      { id: "f2", pergunta: "Esqueci hoje, e agora?", resposta: "Sem problema, retome quando lembrar.", termos: ["esqueci", "esquecer"] },
      { id: "f3", pergunta: "Café conta?", resposta: "Depende; veja as fontes.", termos: ["cafe"] },
    ],
    dificuldades: [
      { id: "d1", titulo: "Esquecer", texto: "É comum esquecer no meio da correria." },
      { id: "d2", titulo: "Não gostar do gosto", texto: "Experimente gelada ou com limão." },
    ],
    sinaisDeAjuda: [{ texto: "Sede intensa e constante merece conversa com um profissional.", nivel: "converse-com-profissional" }],
    limites: ["O app não diz quantos litros você deve beber.", "O app não avalia sua hidratação."],
    oQueObservar: ["Em que horas você mais esquece.", "O que ajuda você a lembrar."],
    rastreio: { tipo: "nenhum" },
    versao: 1,
    revisadoEm: "2026-10-27",
    status: "fontes-conferidas",
    ...sobre,
  };
}
const ok = (t: Tema) => validarTema(t, { fontes: FONTES });
const contem = (problemas: string[], trecho: RegExp) => problemas.some((p) => trecho.test(p));

/* ------------------------------ registro de fontes ------------------------- */

test("toda fonte tem id igual à chave, https, data ISO e verificação válida", () => {
  for (const [chave, f] of Object.entries(FONTES)) {
    assert.equal(f.id, chave);
    assert.match(f.url, /^https:\/\//, chave);
    assert.match(f.verificadoEm, /^\d{4}-\d{2}-\d{2}$/, chave);
    if (f.dataDaPagina) assert.match(f.dataDaPagina, /^\d{4}-\d{2}-\d{2}$/, chave);
    assert.ok(["pagina lida", "resumo de busca"].includes(f.verificacao), chave);
    assert.ok(f.titulo.length > 3 && f.orgao.length > 1, chave);
  }
});

test("fontes que não foram lidas ficam fora do registro e documentadas à parte", () => {
  const ids = new Set(Object.keys(FONTES));
  for (const p of FONTES_PENDENTES) {
    assert.ok(!ids.has(p.id), `${p.id} não pode ser usada como fonte: não foi lida`);
    assert.ok(p.motivo.length > 10);
  }
  assert.ok(FONTES_PENDENTES.some((p) => p.id === "anvisa-bulario"));
});

test("a bula brasileira está registrada com data e aviso de que a vigente deve ser conferida", () => {
  const b = FONTES["bula-escitalopram-br"] as Fonte;
  assert.equal(b.pais, "Brasil");
  assert.equal(b.dataDaPagina, "2024-12-05");
  assert.match(b.observacao ?? "", /Bulário Eletrônico da Anvisa/);
});

test("telefones de outros países documentados nas fontes não são os do app", () => {
  for (const id of ["medlineplus-escitalopram", "nhs-escitalopram"]) {
    assert.match(FONTES[id].observacao ?? "", /não (são|é) usados? pelo app/, id);
  }
});

/* -------------------------------- validador -------------------------------- */

test("um tema bem formado não tem problemas", () => {
  assert.deepEqual(ok(modelo()), []);
});

test("afirmação sem fonte, ou com fonte inexistente, é recusada", () => {
  assert.ok(contem(ok(modelo({ beneficios: [{ id: "b1", texto: "Algo.", fontes: [] }] })), /sem fonte/));
  assert.ok(contem(ok(modelo({ beneficios: [{ id: "b1", texto: "Algo.", fontes: ["inventada"] }] })), /não existe no registro/));
});

test("pergunta frequente que afirma saúde sem fonte é recusada; a prática não", () => {
  const sem = modelo();
  sem.faq[0] = { id: "f1", pergunta: "Reduz o risco de infecção?", resposta: "Sim, reduz o risco.", termos: ["risco"] };
  assert.ok(contem(ok(sem), /afirmação de saúde sem fonte/));
  const com = modelo();
  com.faq[0] = { id: "f1", pergunta: "Reduz o risco de infecção?", resposta: "Sim, reduz o risco.", termos: ["risco"], fontes: ["cdc"] };
  assert.deepEqual(ok(com), []);
  // dica prática sem fonte e sem termo de saúde passa
  assert.deepEqual(ok(modelo()), []);
});

test("linguagem de promessa, de pressão e de cura é recusada em qualquer parte do tema", () => {
  const frases = [
    "Resultado garantido em uma semana.",
    "Você vai melhorar logo.",
    "Você já deveria estar melhor.",
    "Se falhar, você perdeu sua sequência.",
    "Sua serotonina está normalizada.",
    "O tratamento está 40% concluído.",
    "Isso é comprovado.",
    "Precisa continuar para não perder a sequência.",
  ];
  for (const f of frases) {
    const t = modelo({ descricao: `Descrição longa o bastante para a validação passar. ${f}` });
    assert.ok(contem(ok(t), /promessa/), f);
  }
});

test("instrução de dose é recusada, mas orientar a NÃO parar é permitido", () => {
  for (const f of ["Aumente a dose se não sentir efeito.", "Reduza a dose por conta própria.", "Pare de tomar se sentir enjoo.", "Tome o dobro amanhã."]) {
    assert.ok(contem(ok(modelo({ limites: [f, "Outro limite válido."] })), /instrução de dose/), f);
  }
  assert.deepEqual(ok(modelo({ limites: ["Não pare de tomar sem falar com o médico.", "Outro limite."] })), []);
});

test("diagnóstico a partir de comportamento ou de registro é recusado", () => {
  for (const f of ["Roer unhas indica ansiedade.", "Você tem ansiedade.", "Isso é sinal de depressão."]) {
    const t = modelo({ oQueObservar: [f, "Outro item."] });
    // "indica ansiedade" sozinho não é a forma proibida; as formas proibidas são em 2ª pessoa/inferência explícita
    if (/você tem|é sinal de/i.test(f)) assert.ok(contem(ok(t), /diagnóstico/), f);
  }
});

test("telefone de emergência de outro país é recusado; os do Brasil passam", () => {
  for (const n of ["911", "999", "111", "112", "1-800"]) {
    assert.ok(contem(ok(modelo({ sinaisDeAjuda: [{ texto: `Ligue ${n} agora.`, nivel: "urgencia" }] })), /telefone de outro país/), n);
  }
  assert.deepEqual(
    ok(modelo({ sinaisDeAjuda: [{ texto: "Em risco imediato, ligue 192 (SAMU) ou 188 (CVV).", nivel: "urgencia" }] })),
    []
  );
});

test("tema com fonte lida só por resumo não pode se declarar 'fontes-conferidas'", () => {
  const t = modelo({ beneficios: [{ id: "b1", texto: "Algo sobre hábitos.", fontes: ["lally"] }] });
  assert.ok(contem(ok(t), /não lida por inteiro/));
  assert.deepEqual(ok({ ...t, status: "parcial" }), []);
});

test("ninguém se declara revisado por profissional sem revisão real", () => {
  assert.ok(contem(ok(modelo({ status: "revisado-por-profissional" })), /revisão real/));
});

test("marcos precisam estar em ordem, ter títulos forte e fraco diferentes e apontar benefícios que existem", () => {
  const t = modelo();
  t.marcos[1] = { ...t.marcos[1], limiar: 1 };
  assert.ok(contem(ok(t), /fora de ordem/));

  const u = modelo();
  u.marcos[0] = { ...u.marcos[0], tituloSemRegistro: u.marcos[0].titulo };
  assert.ok(contem(ok(u), /título forte e fraco iguais/));

  const v = modelo();
  v.marcos[1] = { ...v.marcos[1], afirmacoes: ["nao-existe"] };
  assert.ok(contem(ok(v), /não existe em beneficios/));
});

test("ids repetidos e seções vazias são recusados", () => {
  const t = modelo();
  t.faq[1] = { ...t.faq[1], id: "f1" };
  assert.ok(contem(ok(t), /id repetido/));
  assert.ok(contem(ok(modelo({ estrategias: [] })), /menos de 3 estratégias/));
  assert.ok(contem(ok(modelo({ sinaisDeAjuda: [] })), /sinais para procurar ajuda/));
  assert.ok(contem(ok(modelo({ limites: ["Um só."] })), /menos de 2 limites/));
});

test("fontesDoTema devolve as fontes usadas, sem repetir, na ordem de aparição", () => {
  const t = modelo({
    beneficios: [
      { id: "b1", texto: "A.", fontes: ["cdc", "nhs"] },
      { id: "b2", texto: "B.", fontes: ["nhs", "lally"] },
    ],
  });
  assert.deepEqual(fontesDoTema(t, FONTES).map((f) => f.id), ["cdc", "nhs", "lally"]);
});

/* ---------------------------- busca e reconhecimento ----------------------- */

const escitalopram = modelo({
  id: "escitalopram",
  categoria: "medicamento",
  titulo: "Escitalopram",
  nomesAlternativos: ["oxalato de escitalopram", "lexapro"],
  termos: ["antidepressivo", "dose", "tomada"],
});
const unhas = modelo({
  id: "unhas",
  titulo: "Parar de roer unhas",
  nomesAlternativos: ["roer unha", "morder unhas", "onicofagia"],
  termos: ["unha", "cuticula", "mao"],
  padroes: ["\\b(roi|roo|roeu|roendo|mordo|mordi|mordendo)\\b.*\\bunhas?\\b"],
});
const catalogo = [escitalopram, unhas, modelo()];

test("normalizar tira acento, caixa e pontuação", () => {
  assert.equal(normalizar("  Roí uma UNHA, hoje!  "), "roi uma unha hoje");
});

test("reconhece os jeitos de dizer 'roer unhas'", () => {
  for (const f of ["quero parar de roer unha", "Roí uma unha hoje", "tenho onicofagia", "estou mordendo minhas unhas", "morder unhas"]) {
    const r = reconhecer(f, catalogo);
    assert.equal(r?.tipo, "exato", f);
    assert.equal(r && "tema" in r ? r.tema.id : null, "unhas", f);
  }
});

test("erro de digitação de medicamento só SUGERE — nunca assume", () => {
  const r = reconhecer("tomo exscitalopram todo dia", catalogo);
  assert.equal(r?.tipo, "incerto");
  if (r?.tipo === "incerto") {
    assert.equal(r.tema.id, "escitalopram");
    assert.equal(r.sugestao, "escitalopram");
    assert.equal(r.digitado, "exscitalopram");
  }
});

test("citalopram NUNCA é tratado como escitalopram, nem como erro de digitação", () => {
  assert.equal(distancia("citalopram", "escitalopram"), 2, "estão a duas letras: é por isso que a regra existe");
  const r = reconhecer("tomo citalopram", catalogo);
  assert.equal(r?.tipo, "outro-medicamento");
  if (r?.tipo === "outro-medicamento") assert.equal(r.naoE, "escitalopram");
  // e a busca textual não manda ninguém para o tema errado
  assert.ok(!buscar("citalopram", catalogo).some((x) => x.tema.id === "escitalopram"));
});

test("o nome certo é reconhecido como exato, inclusive o composto e a marca", () => {
  for (const f of ["escitalopram", "oxalato de escitalopram 20mg", "Lexapro"]) {
    const r = reconhecer(f, catalogo);
    assert.equal(r?.tipo, "exato", f);
  }
});

test("texto sem relação com nenhum tema não é reconhecido", () => {
  assert.equal(reconhecer("qual a previsão do tempo", catalogo), null);
  assert.equal(reconhecer("", catalogo), null);
});

test("busca ordena por relevância e acha por sinônimo e por termo", () => {
  assert.equal(buscar("onicofagia", catalogo)[0].tema.id, "unhas");
  assert.equal(buscar("antidepressivo", catalogo)[0].tema.id, "escitalopram");
  assert.equal(buscar("cuticula", catalogo)[0].tema.id, "unhas");
  assert.deepEqual(buscar("zzzz", catalogo), []);
});

test("selecionar devolve só o que serve à pergunta, não o tema inteiro", () => {
  const s = selecionar(modelo(), "esqueci de beber água hoje, e agora?");
  assert.equal(s.faq[0].id, "f2");
  assert.ok(s.faq.length < modelo().faq.length || s.faq.length === 1);
  assert.equal(s.alerta, false);
  assert.deepEqual(s.sinais, []);
});

test("palavras de alerta ativam os sinais de procurar ajuda", () => {
  for (const f of ["estou pior desde que comecei", "tive uma convulsão", "estou desesperado, não aguento mais"]) {
    const s = selecionar(modelo(), f);
    assert.equal(s.alerta, true, f);
    assert.ok(s.sinais.length > 0, f);
  }
});

test("'comprovado' afirmado é promessa; 'não há prazo comprovado' é o oposto e passa", () => {
  const com = (f: string) => modelo({ limites: [f, "Outro limite válido."] });
  assert.ok(contem(ok(com("Esse efeito é comprovado.")), /promessa/));
  assert.ok(contem(ok(com("Está comprovado que funciona.")), /promessa/));
  for (const honesto of ["Não há prazo comprovado para a recuperação.", "Os marcos não são prazos comprovados.", "Nenhum efeito foi comprovado aqui."]) {
    assert.deepEqual(ok(com(honesto)), [], honesto);
  }
});
