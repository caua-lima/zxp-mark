import type { Tema } from "../tipos.ts";

/**
 * Reduzir a cafeína.
 *
 * Fonte lida: MedlinePlus "Caffeine" (EUA; página de 2021, sem data de revisão). A página não orienta como
 * reduzir aos poucos: as estratégias abaixo de redução gradual são sugestões práticas, não afirmações da fonte.
 */
export const cafeina: Tema = {
  id: "cafeina",
  categoria: "habito",
  titulo: "Reduzir a cafeína",
  nomesAlternativos: ["cafeina", "tomar menos cafe", "reduzir cafe", "cafe demais", "energetico", "energeticos"],
  termos: ["cafe", "cafeina", "energetico", "refrigerante", "cha", "cola", "xicara", "ansiedade", "dor de cabeca"],
  descricao:
    "Entender de onde vem a cafeína, o que ela faz no corpo e como diminuir o consumo se você quiser. Serve também para quem percebe que café, chá ou energético estão atrapalhando o sono ou deixando o corpo agitado.",
  objetivos: [
    "Saber quanta cafeína você consome por dia e de onde ela vem",
    "Reduzir o consumo se ele estiver atrapalhando o sono ou deixando você agitado",
    "Trocar alguns cafés por alternativas sem cafeína",
  ],
  beneficios: [
    {
      id: "efeitos",
      texto: "A cafeína estimula o sistema nervoso central, o que pode aumentar a atenção e a energia. Ela atinge o pico no sangue em cerca de uma hora e seus efeitos podem durar de quatro a seis horas.",
      fontes: ["medlineplus-cafeina"],
    },
    {
      id: "excesso",
      texto: "Em excesso, a cafeína pode causar inquietação, tremores, insônia, dor de cabeça, tontura, batimentos acelerados, desidratação, ansiedade e dependência (precisar de mais para sentir o mesmo efeito). Reduzir quando há esses sinais pode aliviá-los.",
      fontes: ["medlineplus-cafeina"],
      ressalva: "A última frase é consequência do que a fonte descreve; a fonte não traz um plano de redução.",
    },
    {
      id: "limite",
      texto: "Para a maioria das pessoas, consumir até 400 mg de cafeína por dia não é prejudicial. Algumas pessoas são mais sensíveis do que outras.",
      fontes: ["medlineplus-cafeina"],
    },
  ],
  marcos: [],
  estrategias: [
    { id: "mapear", titulo: "Descubra de onde vem", texto: "A cafeína está em café, chá, cola, energéticos, algumas gomas e lanches, e em alguns remédios para dor e resfriado. Anote por alguns dias o que você consome. Os teores variam muito, e rótulos de energéticos podem não mostrar a quantidade real.", quando: ["quanto cafe", "de onde vem", "energetico"], fontes: ["medlineplus-cafeina"] },
    { id: "gradual", titulo: "Diminua aos poucos", texto: "Parar de repente pode causar dor de cabeça, sonolência, irritação, enjoo e dificuldade de concentração, que a fonte diz passarem em geral em alguns dias. Trocar uma xícara por vez por uma opção sem cafeína é uma forma de suavizar.", quando: ["parar de vez", "dor de cabeca", "abstinencia", "reduzir"], fontes: ["medlineplus-cafeina"] },
    { id: "horario", titulo: "Limite o horário", texto: "Como o efeito pode durar de quatro a seis horas, deixar o café para a primeira parte do dia pode ajudar quem dorme mal.", quando: ["dormir", "insonia", "noite", "tarde"], fontes: ["medlineplus-cafeina", "nhs-sono"] },
    { id: "alternativa", titulo: "Troque por bebida morna sem cafeína", texto: "Chá de ervas ou uma bebida morna sem cafeína mantêm o ritual da pausa sem a cafeína.", quando: ["vontade de cafe", "pausa", "ritual"], fontes: ["nhs-sono"] },
  ],
  faq: [
    { id: "quanto-posso", pergunta: "Quanta cafeína é demais?", resposta: "Segundo a fonte, para a maioria das pessoas até 400 mg por dia não é prejudicial, mas há quem seja mais sensível. Como exemplo, uma xícara grande de café (cerca de 240 mL) tem aproximadamente de 95 a 200 mg. Se você tem dúvida, converse com um profissional.", termos: ["quanto", "quantos cafes", "limite", "demais", "400"], fontes: ["medlineplus-cafeina"] },
    { id: "dor-de-cabeca", pergunta: "Parei o café e estou com dor de cabeça. É normal?", resposta: "A fonte lista dor de cabeça, sonolência, irritação, enjoo e dificuldade de concentração ao parar de repente, e diz que costumam passar em alguns dias. Se a dor for forte ou não melhorar, procure um profissional.", termos: ["dor de cabeca", "parei o cafe", "abstinencia", "irritado"], fontes: ["medlineplus-cafeina"] },
    { id: "energetico", pergunta: "E o energético?", resposta: "A fonte observa que o teor de cafeína varia e pode não aparecer no rótulo, que há açúcar e outros ingredientes, e que misturar cafeína com álcool é perigoso porque pode mascarar o quanto a pessoa bebeu.", termos: ["energetico", "monster", "red bull", "alcool"], fontes: ["medlineplus-cafeina"] },
    { id: "quem-deve-cuidar", pergunta: "Quem deve falar com um profissional antes?", resposta: "A fonte indica gestantes e quem amamenta, pessoas com problemas de sono, enxaqueca ou dores de cabeça crônicas, ansiedade, refluxo ou úlcera, arritmia, pressão alta, quem usa certos medicamentos ou suplementos, e crianças e adolescentes.", termos: ["gravida", "gestante", "ansiedade", "pressao", "remedio", "interacao"], fontes: ["medlineplus-cafeina"] },
    { id: "ansiedade", pergunta: "A cafeína piora a ansiedade?", resposta: "A fonte lista ansiedade entre os efeitos do excesso de cafeína e recomenda que quem tem ansiedade converse com um profissional sobre limitar ou evitar. O app não diz se a sua ansiedade vem da cafeína.", termos: ["ansiedade", "nervoso", "agitado", "coracao acelerado"], fontes: ["medlineplus-cafeina"] },
  ],
  dificuldades: [
    { id: "ritual", titulo: "O café é um ritual, não só energia", texto: "Muita gente sente falta da pausa e do cheiro, não só do efeito. Manter o ritual com outra bebida ajuda a separar as duas coisas." },
    { id: "sono-ruim", titulo: "Sono ruim leva a mais café", texto: "Dormir mal costuma aumentar a vontade de cafeína, que por sua vez atrapalha o sono. Cuidar do horário do último café pode quebrar esse ciclo." },
    { id: "cansaco-inicio", titulo: "Cansaço nos primeiros dias", texto: "Ao reduzir, o corpo pode reclamar por alguns dias. Reduzir aos poucos e dormir bem costuma tornar a fase mais leve." },
  ],
  sinaisDeAjuda: [
    { texto: "Se você sente batimentos muito acelerados, dor no peito, falta de ar ou tontura forte, procure atendimento. Se for intenso ou repentino, ligue SAMU 192.", nivel: "urgencia" },
    { texto: "Se a ansiedade, a insônia ou as dores de cabeça persistem mesmo reduzindo a cafeína, ou se você tem uma condição de saúde ou usa medicamentos, converse com um profissional de saúde.", nivel: "converse-com-profissional", fontes: ["medlineplus-cafeina"] },
  ],
  limites: [
    "O app não diz quanta cafeína é adequada para você: o limite da fonte vale para a maioria das pessoas, não para todas.",
    "A fonte não traz um plano de redução gradual; as estratégias de redução são sugestões práticas.",
    "O app não afirma que a cafeína causa o seu cansaço, ansiedade ou insônia; ele só mostra o que você registra.",
  ],
  oQueObservar: [
    "Quantas bebidas com cafeína você toma por dia e em que horários.",
    "Como você dorme nos dias em que toma café mais tarde ou menos, sem concluir causa.",
    "Quais sintomas aparecem quando você reduz e quanto tempo duram.",
  ],
  rastreio: { tipo: "nenhum" },
  versao: 1,
  revisadoEm: "2026-10-27",
  status: "fontes-conferidas",
  notaEditorial:
    "Fonte principal: MedlinePlus (EUA), página de 2021 sem data de revisão; a fonte usa onças, aqui convertidas de forma aproximada para mL. Uma estratégia usa também a página do NHS sobre sono. A fonte não orienta redução gradual, e isso está dito acima. Os sinais de urgência desta página não vêm da fonte. Não houve revisão por profissional de saúde.",
};
