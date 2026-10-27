import type { Tema } from "../tipos.ts";

/**
 * Higiene bucal.
 *
 * Fonte lida: NHS "How to keep your teeth clean" (Reino Unido). A página não fala de açúcar nem diz de
 * quanto em quanto tempo ir ao dentista; este tema também não.
 */
export const higieneBucal: Tema = {
  id: "higiene-bucal",
  categoria: "rotina",
  titulo: "Cuidar dos dentes",
  nomesAlternativos: ["higiene bucal", "escovar os dentes", "escovar dentes", "fio dental", "enxaguante bucal", "boca"],
  termos: ["dente", "dentes", "escovar", "escova", "fio", "dental", "pasta", "flor", "enxaguante", "gengiva"],
  descricao:
    "Um passo a passo simples, com base em uma fonte oficial do Reino Unido, para escovar, limpar entre os dentes e usar enxaguante. Serve como lembrete de rotina e para registrar se você está conseguindo manter o hábito.",
  objetivos: [
    "Escovar os dentes duas vezes ao dia com pasta com flúor",
    "Limpar entre os dentes",
    "Ter uma rotina simples, fácil de repetir",
  ],
  beneficios: [
    {
      id: "escovacao",
      texto: "Escovar os dentes com pasta com flúor duas vezes ao dia, por cerca de 2 minutos, é a orientação da fonte. Uma das escovações deve ser a última coisa antes de dormir.",
      fontes: ["nhs-higiene-bucal"],
    },
    {
      id: "fio",
      texto: "Usar fio dental com regularidade pode reduzir a doença da gengiva, as cáries e o mau hálito ao remover a placa junto à gengiva.",
      fontes: ["nhs-higiene-bucal"],
    },
    {
      id: "enxaguante",
      texto: "Um enxaguante com flúor pode ajudar a prevenir cáries.",
      fontes: ["nhs-higiene-bucal"],
    },
  ],
  marcos: [],
  estrategias: [
    { id: "duas-vezes", titulo: "Duas escovações, uma delas à noite", texto: "Escove duas vezes ao dia por cerca de 2 minutos, limpando por dentro, por fora e as superfícies de mastigação. Deixe uma das escovações para antes de dormir.", quando: ["escovar", "esqueco de escovar", "rotina"], fontes: ["nhs-higiene-bucal"] },
    { id: "nao-enxaguar", titulo: "Cuspa, mas não enxágue na hora", texto: "Depois de escovar, cuspa o excesso de pasta e evite enxaguar a boca com água logo em seguida; assim o flúor continua em contato com os dentes.", quando: ["enxaguar", "pasta"], fontes: ["nhs-higiene-bucal"] },
    { id: "entre-dentes", titulo: "Fio dental antes de escovar", texto: "A fonte orienta usar o fio antes da escovação. Escovas interdentais podem substituir o fio, especialmente onde há espaços, e precisam encaixar com folga justa. Palitos de madeira não são recomendados.", quando: ["fio dental", "entre os dentes", "palito"], fontes: ["nhs-higiene-bucal"] },
    { id: "enxaguante-horario", titulo: "Enxaguante em outro horário", texto: "Se usar enxaguante com flúor, use em outro momento, como depois do almoço, e não coma nem beba nada por 30 minutos depois.", quando: ["enxaguante", "listerine", "colutorio"], fontes: ["nhs-higiene-bucal"] },
    { id: "lembrete", titulo: "Amarre ao que você já faz", texto: "Escovar logo depois de uma atividade fixa, como o café da manhã e o último gesto antes da cama, ajuda a transformar em rotina.", quando: ["esquecer", "rotina", "habito"] },
  ],
  faq: [
    { id: "quantas-vezes", pergunta: "Quantas vezes devo escovar?", resposta: "A fonte orienta duas vezes ao dia por cerca de 2 minutos, com pasta com flúor, sendo uma delas antes de dormir.", termos: ["quantas vezes", "escovar", "por dia", "tempo de escovacao"], fontes: ["nhs-higiene-bucal"] },
    { id: "eletrica-ou-manual", pergunta: "Escova elétrica é melhor que a manual?", resposta: "Segundo a fonte, escova elétrica e manual são igualmente boas se todas as superfícies forem limpas com pasta com flúor.", termos: ["escova eletrica", "manual", "melhor escova"], fontes: ["nhs-higiene-bucal"] },
    { id: "enxaguar-depois", pergunta: "Posso enxaguar a boca depois de escovar?", resposta: "A fonte recomenda não enxaguar a boca imediatamente após escovar: cuspa o excesso de pasta.", termos: ["enxaguar", "bochechar", "depois de escovar"], fontes: ["nhs-higiene-bucal"] },
    { id: "fio-ou-palito", pergunta: "Posso usar palito de dente?", resposta: "A fonte desaconselha palitos de madeira, que podem machucar a gengiva e levar a infecção. Fio dental ou escova interdental são as alternativas citadas.", termos: ["palito", "fio dental", "escova interdental"], fontes: ["nhs-higiene-bucal"] },
    { id: "dentista", pergunta: "Com que frequência vou ao dentista?", resposta: "A fonte consultada não indica uma frequência. Um dentista pode orientar de acordo com as suas necessidades, inclusive sobre a pasta e a limpeza entre os dentes.", termos: ["dentista", "consulta", "frequencia", "check up"], fontes: ["nhs-higiene-bucal"] },
  ],
  dificuldades: [
    { id: "cansaco-noite", titulo: "Pular a escovação da noite", texto: "O cansaço faz muita gente pular a última escovação. Deixar a escova à vista e escovar antes de ficar sem energia, logo depois do jantar, ajuda." },
    { id: "fio-incomoda", titulo: "O fio dental incomoda", texto: "Se o fio for desconfortável, a escova interdental é uma alternativa citada pela fonte. Um dentista pode mostrar a técnica e o tamanho certos." },
  ],
  sinaisDeAjuda: [
    { texto: "Se você tem dor nos dentes, gengiva sangrando ou inchada, ou mau hálito que não passa, procure um dentista: a fonte indica profissionais de saúde bucal para orientar o cuidado conforme a sua necessidade.", nivel: "converse-com-profissional", fontes: ["nhs-higiene-bucal"] },
  ],
  limites: [
    "O app não diagnostica problemas nos dentes ou na gengiva.",
    "A fonte consultada não fala de açúcar nem de frequência de consultas ao dentista; o app não afirma nada sobre isso.",
    "Registrar a escovação mede o hábito, não a saúde da boca.",
  ],
  oQueObservar: [
    "Em quais momentos do dia você costuma esquecer de escovar.",
    "Se a rotina fica mais fácil amarrada a outra atividade fixa.",
    "Se algo incomoda, como a gengiva ou a sensibilidade, para contar ao dentista.",
  ],
  rastreio: { tipo: "nenhum" },
  versao: 1,
  revisadoEm: "2026-10-27",
  status: "fontes-conferidas",
  notaEditorial:
    "Fonte única: NHS (Reino Unido). Os teores de flúor da página não são reproduzidos porque variam por país e por faixa etária. Nenhuma fonte brasileira foi lida. A sugestão de amarrar a escovação a outra atividade é prática e não vem da fonte. Não houve revisão por dentista.",
};
