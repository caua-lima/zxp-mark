import type { Tema } from "../tipos.ts";

/**
 * Dormir melhor e reduzir telas antes de dormir.
 *
 * Fonte lida: NHS "How to fall asleep faster and sleep better" (sem data de revisão na página).
 * A página não informa quantas horas um adulto precisa dormir: este tema não afirma nenhum número de horas.
 */
export const sono: Tema = {
  id: "sono",
  categoria: "rotina",
  titulo: "Dormir melhor",
  nomesAlternativos: ["sono", "dormir bem", "dormir melhor", "insonia", "telas antes de dormir", "celular antes de dormir", "rotina de sono"],
  padroes: ["\\b(dormir|dormi|insonia|sono)\\b"],
  termos: ["dormir", "sono", "cama", "acordar", "noite", "celular", "tela", "telas", "insonia", "madrugada"],
  descricao:
    "Hábitos que costumam ajudar a pegar no sono e a dormir com mais qualidade: horários parecidos, menos telas na última hora do dia, um quarto confortável e um jeito de lidar com as preocupações da noite. Aqui você lê as sugestões e, se quiser, acompanha o seu sono na aba de sono.",
  objetivos: [
    "Ter horários de dormir e acordar mais regulares",
    "Reduzir o uso de telas na hora antes de dormir",
    "Montar uma pequena rotina para desacelerar à noite",
    "Observar o que muda no seu sono, do seu jeito",
  ],
  beneficios: [
    {
      id: "horarios",
      texto:
        "Deitar e levantar em horários parecidos todos os dias ajuda o corpo a aprender quando é hora de dormir. A página recomenda manter a rotina também nos dias sem trabalho.",
      fontes: ["nhs-sono"],
    },
    {
      id: "telas",
      texto:
        "Celulares, tablets e computadores emitem luz azul, que pode dificultar pegar no sono. A orientação é evitá-los por cerca de uma hora antes de deitar.",
      fontes: ["nhs-sono"],
    },
    {
      id: "preocupacoes",
      texto:
        "Preocupação, estresse e ansiedade podem atrapalhar o sono. Conversar com alguém de confiança ou escrever o que preocupa pode ajudar, e listar as tarefas do dia seguinte antes de dormir é uma sugestão para quem se preocupa na cama.",
      fontes: ["nhs-sono"],
    },
    {
      id: "movimento",
      texto:
        "A atividade física regular pode ajudar a dormir melhor, e até pequenas quantidades ajudam. Se se exercitar perto da hora de dormir atrapalhar, vale tentar mais cedo no dia.",
      fontes: ["nhs-sono"],
    },
    {
      id: "substancias",
      texto:
        "Álcool e nicotina podem prejudicar o sono; a orientação é evitá-los de 1 a 2 horas antes de deitar. Chá, café e alguns refrigerantes têm cafeína, que pode manter a pessoa alerta.",
      fontes: ["nhs-sono"],
    },
  ],
  marcos: [],
  estrategias: [
    { id: "horario-fixo", titulo: "Horário parecido todos os dias", texto: "Escolha um horário de deitar e de levantar que caiba na sua vida e tente repeti-lo, inclusive nos dias livres. Comece por um dos dois se os dois parecerem demais.", quando: ["nao consigo dormir", "horario", "acordo tarde"], fontes: ["nhs-sono"] },
    { id: "sem-tela", titulo: "Uma hora sem telas", texto: "Deixe o celular carregando longe da cama e use a última hora para algo calmo: ler, ouvir música ou um podcast, meditar ou fazer exercícios de respiração.", quando: ["celular", "tela", "redes sociais", "antes de dormir"], fontes: ["nhs-sono"] },
    { id: "lista", titulo: "Escreva o dia seguinte", texto: "Se a cabeça acelera na cama, anote antes de deitar o que precisa fazer amanhã. Tirar da cabeça e pôr no papel pode ajudar a desligar.", quando: ["preocupado", "cabeca nao para", "pensando demais", "ansiedade"], fontes: ["nhs-sono"] },
    { id: "quarto", titulo: "Quarto silencioso, escuro e fresco", texto: "Teste o que funciona para você: tampões de ouvido, cortinas bem fechadas, celular no silencioso e virado para baixo, máscara de olhos, ajustar a temperatura ou ruído de fundo suave.", quando: ["barulho", "luz", "calor", "quarto"], fontes: ["nhs-sono"] },
    { id: "levantar", titulo: "Não force o sono", texto: "Se passados uns 20 minutos você ainda estiver acordado, levante, sente em algum lugar confortável e faça algo relaxante. Volte para a cama quando sentir sono.", quando: ["nao consigo dormir", "acordado", "rolando na cama"], fontes: ["nhs-sono"] },
    { id: "ultimas-horas", titulo: "Cuidado com a noite", texto: "Evite refeições muito grandes perto da hora de dormir, e álcool e nicotina nas 1 a 2 horas antes de deitar. Uma bebida morna sem cafeína, como chá de ervas, pode ser uma alternativa.", quando: ["cafe", "jantar", "alcool", "cigarro"], fontes: ["nhs-sono"] },
  ],
  faq: [
    { id: "quantas-horas", pergunta: "Quantas horas preciso dormir?", resposta: "A fonte usada aqui não informa um número de horas, e o app não vai inventar um. Uma pista útil é observar como você se sente ao longo do dia; se estiver difícil, vale conversar com um profissional de saúde.", termos: ["quantas horas", "horas de sono", "quanto dormir", "dormir poucas horas"] },
    { id: "celular-na-cama", pergunta: "Por que evitar o celular antes de dormir?", resposta: "Telas emitem luz azul, que pode dificultar pegar no sono. A orientação da fonte é ficar uma hora sem celular, tablet ou computador antes de deitar.", termos: ["celular", "tela", "luz azul", "antes de dormir", "redes sociais"], fontes: ["nhs-sono"] },
    { id: "nao-durmo", pergunta: "Estou na cama e não durmo. O que fazer?", resposta: "Depois de uns 20 minutos acordado, levante, vá para um lugar confortável e faça algo calmo, sem tela. Volte quando sentir sono. Ficar rolando na cama costuma aumentar a frustração.", termos: ["nao consigo dormir", "nao durmo", "acordado", "insonia", "sem sono"], fontes: ["nhs-sono"] },
    { id: "cafe-a-noite", pergunta: "Café e chá atrapalham o sono?", resposta: "Chá, café e alguns refrigerantes têm cafeína, que pode manter você alerta. Quem tem dificuldade para dormir pode experimentar trocá-los, à noite, por uma bebida morna sem cafeína.", termos: ["cafe", "cha", "cafeina", "refrigerante", "energetico"], fontes: ["nhs-sono"] },
    { id: "exercicio-noite", pergunta: "Posso me exercitar à noite?", resposta: "A atividade física regular pode ajudar o sono. Se fazer exercício perto da hora de dormir atrapalhar o seu, tente se movimentar mais cedo no dia.", termos: ["exercicio", "treino", "academia", "noite"], fontes: ["nhs-sono"] },
    { id: "como-registrar", pergunta: "Como acompanho meu sono aqui?", resposta: "Na aba de sono você registra a hora de dormir e de acordar. O app mostra o que você registrou, sem avaliar o seu sono.", termos: ["registrar sono", "acompanhar sono", "meu sono"] },
  ],
  dificuldades: [
    { id: "rotina-quebrada", titulo: "Fim de semana e trabalho em turnos", texto: "Nem sempre dá para manter o mesmo horário. Fixar apenas o horário de acordar, ou o ritual de desacelerar, já é um começo." },
    { id: "celular-habito", titulo: "Olhar o celular por hábito", texto: "Se a mão vai sozinha, ajuda carregar o aparelho fora do alcance da cama. Trocar por um livro ou áudio deixa o gesto com outro destino." },
    { id: "noite-ruim", titulo: "Uma noite ruim não desfaz o resto", texto: "Dormir mal uma noite acontece. Retomar a rotina no dia seguinte é o que importa; cobrar-se demais costuma piorar a noite seguinte." },
  ],
  sinaisDeAjuda: [
    { texto: "Se a dificuldade para dormir se repete e atrapalha o seu dia, converse com um profissional de saúde. A fonte aponta para orientações sobre insônia e tratamentos disponíveis por meio de médico ou farmacêutico.", nivel: "converse-com-profissional", fontes: ["nhs-sono"] },
    { texto: "Se a falta de sono vem com tristeza que não passa, muita angústia ou pensamentos de se machucar, procure ajuda agora: CVV 188 (24 h, gratuito) ou SAMU 192 em emergência.", nivel: "urgencia", fontes: ["cvv"] },
  ],
  limites: [
    "O app não diagnostica insônia nem qualquer distúrbio do sono a partir dos seus registros.",
    "O app não informa quantas horas cada pessoa precisa dormir: a fonte consultada não traz esse número.",
    "Mudar um hábito e dormir melhor podem coincidir, mas o app não afirma que um causou o outro.",
  ],
  oQueObservar: [
    "A que horas você costuma deitar e acordar, e se isso varia muito de um dia para o outro.",
    "Como foi a noite nos dias em que você ficou sem tela na última hora, comparado aos outros.",
    "O que você fez nas horas antes de deitar nas noites em que dormiu pior e nas em que dormiu melhor.",
  ],
  rastreio: { tipo: "sono" },
  versao: 1,
  revisadoEm: "2026-10-27",
  status: "fontes-conferidas",
  notaEditorial:
    "Fonte única: NHS (Reino Unido), página sem data de revisão. Nenhuma fonte brasileira sobre sono foi lida. Os telefones de urgência do Reino Unido da página não são usados. Não houve revisão por profissional de saúde.",
};
