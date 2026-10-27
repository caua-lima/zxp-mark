import type { Tema } from "../tipos.ts";

/**
 * Parar de fumar (revisão do tema "cigarro" do app, agora com fontes e linguagem de limites).
 *
 * Fontes lidas: CDC "Benefits of Quitting" (EUA, 15/05/2024) e NHS "Benefits of quitting smoking" (sem data).
 * Os prazos abaixo são os que as fontes publicam; não são previsões para uma pessoa.
 * Nenhuma das duas traz conselhos sobre fissura (vontade de fumar): este tema não inventa.
 */
export const pararDeFumar: Tema = {
  id: "parar-de-fumar",
  categoria: "habito",
  titulo: "Parar de fumar",
  nomesAlternativos: ["cigarro", "parar de fumar", "largar o cigarro", "tabagismo", "fumar", "tabaco", "fumante"],
  termos: ["cigarro", "fumar", "fumo", "tabaco", "nicotina", "tabagismo", "vontade de fumar", "fissura"],
  descricao:
    "O que as fontes oficiais descrevem como benefícios de parar de fumar, com os prazos que elas publicam, e como o app acompanha o seu tempo sem fumar na aba de marcos. Os prazos são médias descritas em estudos, não previsões sobre você.",
  objetivos: [
    "Acompanhar o tempo sem fumar do seu jeito",
    "Conhecer o que as fontes descrevem em cada etapa, sem tratar como previsão",
    "Saber onde buscar apoio",
  ],
  beneficios: [
    {
      id: "geral",
      texto: "Segundo o CDC, parar de fumar melhora a saúde geral e a qualidade de vida em qualquer idade, independentemente de há quanto tempo ou o quanto a pessoa fumou, e reduz o risco de doença cardiovascular, DPOC e vários tipos de câncer.",
      fontes: ["cdc"],
    },
    {
      id: "primeiros-dias",
      texto: "O CDC descreve que, em minutos, a frequência cardíaca cai; em 24 horas, a nicotina no sangue cai a zero; e, em alguns dias, o monóxido de carbono no sangue cai ao nível de quem não fuma. O NHS cita, em dias ou semanas, melhora do paladar e do olfato, respiração mais fácil e mais energia.",
      fontes: ["cdc", "nhs"],
    },
    {
      id: "meses",
      texto: "De 1 a 12 meses, o CDC descreve redução da tosse e da falta de ar. Em 1 a 2 anos, o risco de infarto cai de forma acentuada; o NHS afirma que, após 1 ano, o risco de infarto é metade do de quem fuma.",
      fontes: ["cdc", "nhs"],
    },
    {
      id: "longo-prazo",
      texto: "Em prazos longos, as fontes descrevem queda do risco de AVC e de vários cânceres: por exemplo, após 10 anos o risco de morte por câncer de pulmão cai pela metade, e após 15 anos o risco de infarto se aproxima ao de quem nunca fumou.",
      fontes: ["nhs", "cdc"],
    },
    {
      id: "saude-mental",
      texto: "O NHS afirma que, depois da fase de abstinência, ansiedade, depressão e estresse diminuem, e que os benefícios para a saúde mental podem começar em apenas 6 semanas.",
      fontes: ["nhs"],
    },
    {
      id: "outros",
      texto: "Parar de fumar protege familiares e colegas da fumaça de segunda mão, e o NHS estima, para o Reino Unido, economia de cerca de £49 por semana para o fumante médio.",
      fontes: ["nhs", "cdc"],
      ressalva: "O valor em libras é uma média do Reino Unido; no Brasil, o gasto depende do preço do maço que você compra.",
    },
  ],
  marcos: [],
  estrategias: [
    { id: "apoio", titulo: "Busque apoio", texto: "O NHS afirma que o apoio aumenta de forma significativa as chances de parar de vez. As formas citadas incluem grupos online, apoio por telefone e atendimento presencial com um profissional.", quando: ["apoio para parar", "grupo de apoio", "sozinho", "nao consigo parar"], fontes: ["nhs"] },
    { id: "produtos", titulo: "Converse sobre produtos de apoio", texto: "O NHS diz que produtos para parar de fumar podem facilitar e aumentar as chances de parar de vez. Um profissional de saúde pode orientar o que se aplica a você, sem que o app indique produto ou dose.", quando: ["adesivo", "remedio", "goma", "ajuda para parar"], fontes: ["nhs"] },
    { id: "evitar-forca-de-vontade", titulo: "Não dependa só da força de vontade", texto: "A fonte observa que parar pode ser difícil, especialmente de uma vez e só na base da força de vontade. Combinar com apoio costuma ser mais realista.", quando: ["forca de vontade", "recaida", "voltei a fumar"], fontes: ["nhs"] },
    { id: "registrar", titulo: "Registre o seu caminho", texto: "Marque no app a data em que parou e acompanhe o tempo. Se tiver uma recaída, o app trata como parte do caminho: registre e recomece quando quiser, sem apagar o que viveu.", quando: ["registrar", "contagem", "recaida"] },
  ],
  faq: [
    { id: "quanto-tempo-beneficios", pergunta: "Em quanto tempo o corpo começa a melhorar?", resposta: "As fontes descrevem mudanças em minutos (frequência cardíaca), em 24 horas (nicotina no sangue), em dias (monóxido de carbono) e, em dias ou semanas, melhora de paladar, olfato e respiração. São médias de estudos, e a experiência de cada pessoa varia.", termos: ["quanto tempo", "quando melhora", "pulmao", "respiracao", "paladar"], fontes: ["cdc", "nhs"] },
    { id: "ansiedade-ao-parar", pergunta: "Estou mais ansioso desde que parei. É normal?", resposta: "O NHS diz que, passada a fase de abstinência, ansiedade, depressão e estresse diminuem, e que os benefícios para a saúde mental podem começar em até 6 semanas. A fonte não detalha a fase de abstinência: se estiver difícil, converse com um profissional de saúde.", termos: ["ansioso", "ansiedade", "irritado", "abstinencia", "humor"], fontes: ["nhs"] },
    { id: "voltei-a-fumar", pergunta: "Voltei a fumar. Perdi tudo?", resposta: "Você não perdeu o que viveu nem o que aprendeu. As fontes tratam parar como um processo que pode ser retomado, com apoio. O app permite recomeçar a contagem sem apagar o histórico.", termos: ["recaida", "voltei", "fumei de novo", "perdi"], fontes: ["nhs"] },
    { id: "cravings", pergunta: "O que fazer quando bate a vontade de fumar?", resposta: "As fontes consultadas não trazem orientação sobre fissura, e o app não vai inventar. O que elas dizem é que o apoio de profissionais e de grupos aumenta as chances de parar de vez; converse com um profissional sobre estratégias e produtos.", termos: ["vontade", "fissura", "craving", "bateu a vontade"], fontes: ["nhs"] },
    { id: "idade", pergunta: "Se eu fumo há muitos anos, ainda adianta parar?", resposta: "O CDC afirma que parar melhora a saúde e a qualidade de vida em qualquer idade, independentemente de há quanto tempo ou o quanto a pessoa fumou.", termos: ["muitos anos", "adianta", "velho", "tarde demais"], fontes: ["cdc"] },
  ],
  dificuldades: [
    { id: "gatilhos", titulo: "Situações que puxam o cigarro", texto: "Café, bebida, pausas e estresse costumam estar associados ao hábito. Reconhecer esses momentos é o primeiro passo para escolher outra resposta." },
    { id: "recaida-culpa", titulo: "Culpa depois de uma recaída", texto: "Recair não apaga o caminho. Registrar o que aconteceu e retomar com apoio costuma ser mais útil do que se cobrar." },
    { id: "ansiedade-inicio", titulo: "Irritação e ansiedade no começo", texto: "Os primeiros dias e semanas podem ser mais difíceis. Conversar com um profissional de saúde sobre apoio pode tornar essa fase mais leve." },
  ],
  sinaisDeAjuda: [
    { texto: "Se a vontade de fumar ou a irritação estão difíceis de lidar, procure um profissional de saúde: as fontes indicam que o apoio aumenta as chances de parar de vez.", nivel: "converse-com-profissional", fontes: ["nhs"] },
    { texto: "Se você sente muita angústia, desesperança ou pensamentos de se machucar, procure ajuda agora: CVV 188 (24 h, gratuito) ou SAMU 192 em emergência.", nivel: "urgencia", fontes: ["cvv"] },
    { texto: "Dor no peito, falta de ar intensa ou tosse com sangue precisam de avaliação médica urgente; em caso de dúvida, SAMU 192.", nivel: "urgencia" },
  ],
  limites: [
    "O app não diz que você está livre de risco por ter parado: os prazos das fontes são médias populacionais.",
    "O app não indica remédio, adesivo ou dose para parar de fumar.",
    "As fontes consultadas não trazem orientação sobre fissura, e o app não oferece uma.",
    "Dias sem fumar não medem a saúde do seu coração ou do seu pulmão.",
  ],
  oQueObservar: [
    "Em quais situações a vontade de fumar aparece e como você respondeu.",
    "Como você percebe a respiração, o sono e a energia ao longo das semanas, sem atribuir tudo ao cigarro.",
    "Que tipo de apoio ajudou você, e se vale buscar mais.",
  ],
  rastreio: { tipo: "marcos", preset: "cigarro" },
  versao: 1,
  revisadoEm: "2026-10-27",
  status: "fontes-conferidas",
  notaEditorial:
    "Fontes: CDC (EUA, 15/05/2024) e NHS (Reino Unido, sem data). O valor de £49/semana é do Reino Unido. As fontes não trazem conselho sobre fissura; nenhuma fonte brasileira foi lida. A orientação de procurar atendimento para dor no peito e tosse com sangue é bom senso geral e não vem da fonte. Não houve revisão por profissional de saúde.",
};
