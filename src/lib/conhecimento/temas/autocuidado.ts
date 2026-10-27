import type { Tema } from "../tipos.ts";

/**
 * Rotina e autocuidado.
 *
 * Fonte lida: NHS "5 steps to mental wellbeing" (sem data de revisão). A página não diz quando procurar ajuda.
 */
export const autocuidado: Tema = {
  id: "autocuidado",
  categoria: "bem-estar",
  titulo: "Rotina e autocuidado",
  nomesAlternativos: ["autocuidado", "rotina", "bem estar", "bem-estar", "cuidar de mim", "saude mental", "5 passos"],
  termos: ["rotina", "autocuidado", "bem estar", "amigos", "hobby", "voluntariado", "atencao plena", "mindfulness", "solidao"],
  descricao:
    "Cinco passos descritos pelo NHS para o bem-estar mental: conectar-se com pessoas, mover o corpo, aprender algo novo, ajudar os outros e prestar atenção ao momento presente. Serve para montar uma rotina leve e acompanhar o que faz diferença para você.",
  objetivos: [
    "Incluir na semana um pouco de cada um dos cinco passos",
    "Escolher o que cabe na sua vida, sem metas rígidas",
    "Observar o que ajuda o seu humor, do seu jeito",
  ],
  beneficios: [
    { id: "conexao", texto: "Boas relações podem dar senso de pertencimento e valor próprio, chances de compartilhar experiências positivas e apoio emocional.", fontes: ["nhs-5-passos"] },
    { id: "movimento", texto: "A atividade física pode aumentar a autoestima, ajudar a definir e alcançar metas e causar mudanças químicas no cérebro que podem melhorar o humor.", fontes: ["nhs-5-passos"] },
    { id: "aprender", texto: "Aprender coisas novas pode aumentar a confiança e a autoestima, dar senso de propósito e ajudar a se conectar com outras pessoas.", fontes: ["nhs-5-passos"] },
    { id: "ajudar", texto: "Gentileza e ajuda aos outros podem trazer sentimentos positivos, senso de recompensa, propósito e valor próprio.", fontes: ["nhs-5-passos"] },
    { id: "presente", texto: "Prestar atenção aos pensamentos, sentimentos, ao corpo e ao entorno pode ajudar a aproveitar mais a vida, a se entender melhor e a lidar de outro jeito com os desafios.", fontes: ["nhs-5-passos"] },
  ],
  marcos: [],
  estrategias: [
    { id: "conectar", titulo: "Marque um contato", texto: "Combine uma refeição em família, encontre um amigo que você não vê há tempo, converse sem a TV ligada ou almoce com um colega. A fonte pede cuidado em depender só de mensagens e redes sociais.", quando: ["solidao", "sozinho", "amigos", "sem ninguem"], fontes: ["nhs-5-passos"] },
    { id: "mexer", titulo: "Escolha um movimento de que goste", texto: "Caminhar, correr ou exercícios de força e flexibilidade. Não é preciso passar horas na academia; encaixe o que você gosta na rotina.", quando: ["exercicio", "mexer", "parado"], fontes: ["nhs-5-passos"] },
    { id: "aprender-algo", titulo: "Aprenda algo pequeno", texto: "Cozinhar um prato novo, um projeto com tutoriais gratuitos, um curso, um hobby novo. A fonte lembra que não é preciso buscar diplomas se isso não lhe interessa.", quando: ["tedio", "sem animo", "monotonia"], fontes: ["nhs-5-passos"] },
    { id: "ajudar-alguem", titulo: "Faça algo por alguém", texto: "Agradecer, perguntar a alguém como está e ouvir de verdade, ajudar em um projeto ou fazer voluntariado local.", quando: ["proposito", "vazio", "sem sentido"], fontes: ["nhs-5-passos"] },
    { id: "presente-agora", titulo: "Volte ao momento presente", texto: "Pare um instante para notar o que você pensa, sente, o corpo e o ambiente. A página tem orientações separadas sobre atenção plena que o app não reproduz.", quando: ["mindfulness", "atencao plena", "acelerado"], fontes: ["nhs-5-passos"] },
  ],
  faq: [
    { id: "preciso-de-todos", pergunta: "Preciso fazer os cinco passos?", resposta: "Não. A fonte sugere os passos como possibilidades para você se sentir mais positivo; escolha o que couber e combine com o que você gosta. Não existe pontuação por fazer mais.", termos: ["todos", "obrigatorio", "cinco passos"], fontes: ["nhs-5-passos"] },
    { id: "rede-social", pergunta: "Mensagens e redes sociais contam como conexão?", resposta: "A fonte recomenda evitar depender somente de mensagens, e-mail e redes sociais para manter relações; videochamadas e encontros ajudam, sobretudo com quem mora longe.", termos: ["rede social", "mensagem", "whatsapp", "video"], fontes: ["nhs-5-passos"] },
    { id: "ajuda-profissional", pergunta: "Isso substitui terapia ou tratamento?", resposta: "Não. Os cinco passos são recursos de autocuidado. Se você sente que precisa de apoio profissional, procure; veja também o tema sobre terapia e consultas.", termos: ["terapia", "tratamento", "depressao", "substitui"] },
  ],
  dificuldades: [
    { id: "sem-energia", titulo: "Falta de energia para qualquer passo", texto: "Escolha o menor gesto possível, como responder uma mensagem ou caminhar até a esquina. Começar pequeno conta." },
    { id: "perfeccionismo", titulo: "Cobrar-se por fazer tudo", texto: "A ideia é uma rotina leve. Se uma semana ficou só em um passo, ela ainda conta." },
  ],
  sinaisDeAjuda: [
    { texto: "Se a tristeza, a ansiedade ou o desânimo persistem ou atrapalham o seu dia, converse com um profissional de saúde. A página consultada não diz quando procurar ajuda; esta é uma orientação do app.", nivel: "converse-com-profissional" },
    { texto: "Se você sente muita angústia, desesperança ou pensamentos de se machucar, procure ajuda agora: CVV 188 (24 h, gratuito) ou SAMU 192 em emergência.", nivel: "urgencia", fontes: ["cvv"] },
  ],
  limites: [
    "O app não diagnostica depressão, ansiedade ou outro quadro.",
    "A fonte descreve possibilidades e o app não afirma que os passos vão melhorar o humor de uma pessoa específica.",
    "A página consultada não diz quando procurar ajuda profissional.",
  ],
  oQueObservar: [
    "Quais dos cinco passos você conseguiu incluir na semana e como se sentiu.",
    "O que traz mais energia ou mais calma, pela sua própria percepção.",
    "O que atrapalha a rotina e o que pode ser mais simples.",
  ],
  rastreio: { tipo: "nenhum" },
  versao: 1,
  revisadoEm: "2026-10-27",
  status: "fontes-conferidas",
  notaEditorial:
    "Fonte única: NHS (Reino Unido), sem data de revisão. Nenhuma fonte brasileira foi lida. Os sinais de ajuda são orientação do app, não da fonte. Não houve revisão por profissional de saúde.",
};
