import type { Tema } from "../tipos.ts";

/**
 * Consultas e terapia.
 *
 * Fonte lida: NHS "NHS talking therapies" (Reino Unido). Descreve o serviço do Reino Unido; o caminho de acesso
 * no Brasil (SUS, planos, clínicas) é outro e NÃO foi conferido aqui. Por isso este tema fala de terapia em geral
 * e ajuda a se organizar para conversar com um profissional, sem prometer um caminho de acesso.
 */
export const terapia: Tema = {
  id: "terapia",
  categoria: "bem-estar",
  titulo: "Consultas e terapia",
  nomesAlternativos: ["terapia", "psicoterapia", "psicologo", "psicologa", "consulta", "consulta medica", "levar para o medico", "terapia online"],
  termos: ["terapia", "psicologo", "psiquiatra", "consulta", "medico", "conversar", "profissional", "anotar", "preparar"],
  descricao:
    "O que são as terapias de conversa, como podem acontecer e como se preparar para uma consulta. Aqui você organiza o que quer contar ao profissional e guarda anotações para a próxima conversa. O app não indica terapia, nem substitui avaliação.",
  objetivos: [
    "Entender o que são terapias de conversa",
    "Anotar o que quer levar para a consulta",
    "Perceber quando buscar um profissional",
  ],
  beneficios: [
    { id: "o-que-e", texto: "As terapias de conversa (terapias psicológicas) podem ser usadas para tratar muitos problemas de saúde mental. Envolvem conversar sobre pensamentos, sentimentos e comportamentos com um profissional treinado.", fontes: ["nhs-terapias"] },
    { id: "sem-diagnostico", texto: "No serviço do NHS, a pessoa não precisa ter um diagnóstico de condição de saúde mental para procurar terapia de ansiedade e depressão.", fontes: ["nhs-terapias"], ressalva: "Isso descreve o serviço do Reino Unido, não o acesso no Brasil." },
    { id: "formatos", texto: "A terapia pode ser presencial, por vídeo ou telefone, ou por curso online, em grupo ou individual.", fontes: ["nhs-terapias"] },
    { id: "tarefa", texto: "Na terapia cognitivo-comportamental (TCC), a pessoa pratica entre as sessões o que aprendeu.", fontes: ["nhs-terapias"] },
  ],
  marcos: [],
  estrategias: [
    { id: "anotar", titulo: "Anote antes da consulta", texto: "Escreva o que você quer contar: o que mudou, desde quando, como estão o sono, o humor e a rotina, e dúvidas. Os seus registros no app podem ajudar a lembrar.", quando: ["consulta", "esqueco de falar", "o que dizer", "medico"] },
    { id: "levar-resumo", titulo: "Leve um resumo, não o app inteiro", texto: "Selecione o que importa: datas, mudanças que você percebeu e perguntas. O app oferece um resumo de acompanhamento de medicamento que você pode copiar e levar.", quando: ["levar", "resumo", "mostrar ao medico"] },
    { id: "perguntas", titulo: "Faça perguntas", texto: "Pergunte o que não entendeu, o que esperar do tratamento e como será o acompanhamento. Quem define o que fazer é o profissional, não o app.", quando: ["pergunta", "duvida", "nao entendi"] },
    { id: "formato", titulo: "Escolha o formato que cabe em você", texto: "A fonte descreve terapia presencial, por vídeo, telefone ou curso online. Pensar no que é viável para a sua rotina ajuda a manter a continuidade.", quando: ["online", "presencial", "sem tempo"], fontes: ["nhs-terapias"] },
    { id: "profissional-registrado", titulo: "Confira o registro do profissional", texto: "A fonte recomenda, ao escolher um terapeuta particular, verificar se ele é registrado em uma organização profissional reconhecida. No Brasil, o registro profissional correspondente é o do conselho da categoria; o app não confere isso por você.", quando: ["particular", "psicologo", "escolher terapeuta"], fontes: ["nhs-terapias"] },
  ],
  faq: [
    { id: "preciso-de-diagnostico", pergunta: "Preciso ter um diagnóstico para fazer terapia?", resposta: "No serviço do NHS, não. A fonte afirma que não é preciso ter diagnóstico de condição de saúde mental. Como isso vale para o Reino Unido, o acesso no Brasil pode ser diferente: o app não confere os caminhos daqui.", termos: ["diagnostico", "preciso de", "posso fazer terapia"], fontes: ["nhs-terapias"] },
    { id: "como-funciona", pergunta: "Como funciona a terapia?", resposta: "Você conversa com um profissional treinado sobre pensamentos, sentimentos e comportamentos. Pode ser individual ou em grupo, presencial, por vídeo, telefone ou curso online. Na TCC, há prática entre as sessões.", termos: ["como funciona", "o que acontece", "tcc", "sessao"], fontes: ["nhs-terapias"] },
    { id: "primeira-consulta", pergunta: "Como me preparo para a primeira consulta?", resposta: "A fonte consultada não descreve a primeira consulta. Uma sugestão prática é anotar o que mudou, desde quando e o que você quer perguntar, e levar o que você registrou, se quiser.", termos: ["primeira consulta", "preparar", "o que levar", "primeira sessao"] },
    { id: "emergencia", pergunta: "E se eu estiver em crise?", resposta: "Procure ajuda agora: CVV 188 (24 h, gratuito) ou SAMU 192 em emergência. Não espere a próxima consulta.", termos: ["crise", "emergencia", "nao aguento", "urgente"], fontes: ["cvv"] },
  ],
  dificuldades: [
    { id: "vergonha", titulo: "Vergonha de pedir ajuda", texto: "Muita gente adia por vergonha. Dar o primeiro passo com uma pessoa de confiança ou com um profissional que você já conhece pode ser mais leve." },
    { id: "acesso", titulo: "Não saber por onde começar", texto: "O caminho de acesso varia. Uma conversa com um profissional de saúde que você já conhece, ou com a unidade de saúde da sua região, pode ajudar a descobrir as opções." },
  ],
  sinaisDeAjuda: [
    { texto: "Se a tristeza, a ansiedade ou outro sofrimento persistem ou atrapalham o seu dia, converse com um profissional de saúde.", nivel: "converse-com-profissional" },
    { texto: "Se você tem pensamentos de se machucar ou está em crise, procure ajuda agora: CVV 188 (24 h, gratuito) ou SAMU 192 em emergência.", nivel: "urgencia", fontes: ["cvv"] },
  ],
  limites: [
    "O app não indica terapia, não faz triagem e não substitui avaliação profissional.",
    "A fonte descreve o serviço do Reino Unido; o caminho de acesso no Brasil não foi conferido.",
    "A fonte não descreve a primeira consulta, nem o custo, e o app não afirma nada sobre isso.",
  ],
  oQueObservar: [
    "O que você quer contar, desde quando, e o que mudou nas últimas semanas.",
    "Dúvidas e perguntas que surgem entre uma consulta e outra.",
    "O que você percebe depois das consultas, pela sua própria percepção.",
  ],
  rastreio: { tipo: "nenhum" },
  versao: 1,
  revisadoEm: "2026-10-27",
  status: "parcial",
  notaEditorial:
    "Fonte única: NHS (Reino Unido), sobre o serviço do Reino Unido. Nenhuma fonte brasileira sobre acesso (SUS, planos, clínicas) foi lida, por isso o status é parcial e o tema não descreve caminhos de acesso daqui. As sugestões de preparar a consulta são práticas e não vêm da fonte. Não houve revisão por profissional de saúde.",
};
