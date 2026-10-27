import type { Tema } from "../tipos.ts";

/**
 * Respiração e relaxamento.
 *
 * Fontes lidas: NHS "Breathing exercises for stress" (a página não traz cuidados nem contraindicações) e
 * NHS "How to fall asleep faster and sleep better". O app já tem uma aba de respiração guiada.
 */
export const respiracao: Tema = {
  id: "respiracao",
  categoria: "bem-estar",
  titulo: "Respiração e relaxamento",
  nomesAlternativos: ["respirar", "respiracao", "exercicio de respiracao", "relaxar", "relaxamento", "acalmar", "pausa para respirar", "estresse"],
  termos: ["respirar", "respiracao", "relaxar", "calma", "estresse", "ansiedade", "panico", "tensao", "meditacao"],
  descricao:
    "Uma técnica de respiração lenta, descrita pelo NHS, para momentos de estresse e ansiedade, e outras ideias de relaxamento para o fim do dia. Serve para fazer uma pausa curta e voltar com mais calma.",
  objetivos: [
    "Ter uma pausa curta de respiração para os momentos de tensão",
    "Praticar com regularidade, não só quando a tensão já é grande",
    "Incluir um momento de relaxamento no fim do dia",
  ],
  beneficios: [
    {
      id: "tecnica",
      texto: "O NHS descreve esta técnica como calmante para estresse, ansiedade e pânico, que pode ser feita em qualquer lugar.",
      fontes: ["nhs-respiracao"],
    },
    {
      id: "regularidade",
      texto: "Segundo a página, os maiores benefícios vêm de praticar com regularidade, como parte da rotina diária.",
      fontes: ["nhs-respiracao"],
    },
    {
      id: "noite",
      texto: "Para o fim do dia, a página sobre sono sugere leitura de que você gosta, meditação, exercícios de respiração, música calma ou um podcast antes de dormir.",
      fontes: ["nhs-sono"],
    },
  ],
  marcos: [],
  estrategias: [
    { id: "passo-a-passo", titulo: "Respiração na barriga, por 5 minutos", texto: "Fique em pé, sentado com as costas apoiadas ou deitado; afrouxe roupas apertadas. Deixe a respiração descer até a barriga, só até onde for confortável, sem forçar. Inspire pelo nariz, devagar e de forma contínua, e solte o ar pela boca, também devagar. Siga por pelo menos 5 minutos.", quando: ["respirar", "ansiedade", "panico", "estresse", "acalmar"], fontes: ["nhs-respiracao"] },
    { id: "contar", titulo: "Conte de 1 a 5", texto: "Se ajudar, conte de 1 a 5 ao inspirar e ao soltar o ar, de forma uniforme. No começo, pode ser que você não chegue a 5.", quando: ["contar", "ritmo", "nao consigo respirar devagar"], fontes: ["nhs-respiracao"] },
    { id: "rotina", titulo: "Pratique todo dia", texto: "A fonte diz que o benefício é maior com a prática regular. Escolha um horário fixo, como depois de acordar ou antes de dormir.", quando: ["rotina", "todo dia", "habito"], fontes: ["nhs-respiracao"] },
    { id: "antes-de-dormir", titulo: "Respiração antes de dormir", texto: "Faça os exercícios de respiração na última hora do dia, longe do celular, como parte de um ritual calmo antes de deitar.", quando: ["dormir", "noite", "antes de deitar"], fontes: ["nhs-sono"] },
  ],
  faq: [
    { id: "quanto-tempo", pergunta: "Quanto tempo devo respirar assim?", resposta: "A fonte indica pelo menos 5 minutos. Se estiver difícil, começar com menos e aumentar é uma sugestão prática; a fonte não diz que menos funciona.", termos: ["quanto tempo", "minutos", "quantas vezes"], fontes: ["nhs-respiracao"] },
    { id: "funciona-pra-panico", pergunta: "Funciona para ansiedade e pânico?", resposta: "O NHS descreve a técnica como calmante para estresse, ansiedade e pânico. O app não promete resultado para você e não substitui avaliação de um profissional, principalmente se a ansiedade é frequente.", termos: ["ansiedade", "panico", "crise", "funciona"], fontes: ["nhs-respiracao"] },
    { id: "precisa-de-lugar", pergunta: "Preciso de um lugar especial?", resposta: "Não. A fonte diz que pode ser feito em qualquer lugar: em pé, sentado com apoio ou deitado.", termos: ["onde", "lugar", "no trabalho"], fontes: ["nhs-respiracao"] },
    { id: "tontura", pergunta: "E se eu ficar tonto?", resposta: "A página consultada não traz cuidados nem contraindicações. Se sentir tontura, desconforto ou falta de ar, pare, volte à respiração normal e, se persistir, converse com um profissional de saúde.", termos: ["tontura", "tonto", "falta de ar", "mal estar"] },
  ],
  dificuldades: [
    { id: "mente-dispersa", titulo: "A mente foge", texto: "É comum se distrair. Voltar a atenção para o ar entrando e saindo, sem se cobrar, já é parte do exercício." },
    { id: "ansia-de-resultado", titulo: "Esperar que passe na hora", texto: "Na primeira vez pode parecer pouco. A fonte destaca a prática regular; olhe para o conjunto das semanas, não para uma sessão." },
  ],
  sinaisDeAjuda: [
    { texto: "Se a ansiedade ou o estresse atrapalham o seu dia com frequência, converse com um profissional de saúde.", nivel: "converse-com-profissional" },
    { texto: "Se você sente muita angústia, desesperança ou pensamentos de se machucar, procure ajuda agora: CVV 188 (24 h, gratuito) ou SAMU 192 em emergência.", nivel: "urgencia", fontes: ["cvv"] },
  ],
  limites: [
    "O app não diagnostica ansiedade nem outros quadros.",
    "A fonte não traz cuidados nem contraindicações; o app não afirma que o exercício é adequado para qualquer pessoa.",
    "Respirar com calma é um recurso de autocuidado e não substitui tratamento.",
  ],
  oQueObservar: [
    "Em quais momentos você sentiu mais tensão e se conseguiu fazer uma pausa.",
    "Como você se sente antes e depois dos 5 minutos, pela sua própria percepção.",
    "Se a prática regular fica mais fácil depois de algumas semanas.",
  ],
  rastreio: { tipo: "nenhum" },
  versao: 1,
  revisadoEm: "2026-10-27",
  status: "fontes-conferidas",
  notaEditorial:
    "Fontes: NHS, páginas de respiração e de sono (Reino Unido; sem data de revisão exibida). A página de respiração não traz cuidados, e isso está dito. Não houve revisão por profissional de saúde.",
};
