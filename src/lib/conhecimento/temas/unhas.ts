import type { Tema } from "../tipos.ts";

/**
 * Parar de roer unhas (onicofagia).
 *
 * Fontes lidas: AAD (atualizada 12/04/2024) e TLC Foundation for BFRBs
 * (atualizada 28/03/2025). Nenhuma das duas informa se ou quando as unhas e a
 * pele se recuperam depois que a pessoa para — por isso este tema NÃO afirma
 * recuperação nem dá prazo. A fonte brasileira que seria desejável (BVS /
 * Ministério da Saúde) não pôde ser lida (HTTP 503).
 */
export const unhas: Tema = {
  id: "unhas",
  categoria: "habito",
  titulo: "Parar de roer unhas",
  nomesAlternativos: [
    "roer unha",
    "roer unhas",
    "morder unha",
    "morder unhas",
    "onicofagia",
    "roendo unhas",
    "roendo as unhas",
  ],
  termos: ["unha", "unhas", "cuticula", "pelinha", "mao", "maos", "esmalte", "ansiedade", "tedio"],
  padroes: [
    "\\b(roer|roi|roo|roeu|roendo|morder|mordo|mordi|mordendo|mordeu)\\b.*\\bunhas?\\b",
    "\\bunhas?\\b.*\\b(roer|roi|roo|roeu|roendo|morder|mordo|mordi|mordendo|mordeu)\\b",
  ],
  descricao:
    "O hábito de levar as unhas à boca e mordê-las, também chamado de onicofagia. Costuma ser automático e aparecer em situações como tédio, estresse ou tensão. Este tema ajuda a observar quando acontece, testar alternativas para ocupar as mãos e registrar o seu caminho, sem julgamento.",
  objetivos: [
    "Reduzir a frequência dos episódios de roer",
    "Reconhecer as situações em que a vontade aparece",
    "Ter alternativas prontas para ocupar as mãos",
    "Cuidar das unhas e da pele ao redor",
  ],

  beneficios: [
    {
      id: "contaminacao",
      texto:
        "Morder as unhas com frequência pode levar bactérias e vírus da boca para os dedos e das unhas para o rosto e a boca. Menos episódios significam menos oportunidades para esse caminho.",
      fontes: ["aad-unhas", "bfrb-unhas"],
      ressalva: "As fontes descrevem o caminho dos germes. Que menos episódios deem menos oportunidades é consequência direta disso, não uma medição do seu risco.",
    },
    {
      id: "pele-e-unha",
      texto:
        "Morder repetidamente pode deixar a pele ao redor das unhas dolorida e danificar o tecido de onde a unha cresce, o que pode gerar unhas com aspecto anormal. Menos mordidas repetidas significam menos irritação contínua nesses locais.",
      fontes: ["aad-unhas", "bfrb-unhas"],
      ressalva:
        "As fontes consultadas descrevem os danos de morder; nenhuma informa quanto tempo a pele e a unha levam para se recuperar depois que a pessoa para.",
    },
    {
      id: "infeccao-local",
      texto:
        "Quando a pele ao redor da unha se machuca, pode haver infecção, como a paroníquia (inchaço vermelho e doloroso, às vezes com pus). Manter a pele menos agredida diminui as ocasiões em que isso pode acontecer.",
      fontes: ["bfrb-unhas", "aad-unhas"],
    },
    {
      id: "dentes",
      texto:
        "Roer unhas pode desgastar ou lascar o esmalte dos dentes e, com a pressão constante sobre a mandíbula, contribuir para o desalinhamento dos dentes.",
      fontes: ["bfrb-unhas"],
    },
    {
      id: "autoestima",
      texto:
        "Para algumas pessoas, o aspecto das unhas pesa na autoestima e traz constrangimento; cuidar delas pode aliviar esse peso.",
      fontes: ["bfrb-unhas"],
    },
    {
      id: "crescimento",
      texto:
        "Em média, a unha da mão cresce cerca de 3,5 mm por mês, segundo um estudo com adultos jovens saudáveis. Sem roer, esse é o comprimento que deixa de ser perdido a cada mês.",
      fontes: ["bionumbers-unhas"],
      ressalva:
        "É uma média: o ritmo varia com a idade, o dedo e a pessoa. É o crescimento da unha, não um prazo para a pele ao redor ou para a unha voltar ao aspecto de antes.",
    },
    {
      id: "reversao-de-habito",
      texto:
        "Em estudos pequenos, a reversão de hábito (aprender a perceber quando a mão vai à boca e trocar por outro gesto) aumentou o comprimento das unhas em comparação com quem não fez: em adultos, 22% ao fim do tratamento, mantendo 19% cinco meses depois; em crianças, 8 de 30 pararam por completo em três meses.",
      fontes: ["twohig-2003-unhas", "ghanizadeh-2013-unhas"],
      ressalva: "Estudos com poucas pessoas; mostram o que aconteceu nos grupos, não o que vai acontecer com você.",
    },
  ],

  marcos: [
    {
      chave: "1d",
      limiar: 1,
      titulo: "1 dia sem roer, conforme seus registros",
      texto:
        "Você registrou um dia sem roer. Notar em que momentos a vontade aparece já é um passo útil. Que situação puxou mais a vontade hoje?",
      tituloSemRegistro: "1 dia desde o início informado",
      textoSemRegistro:
        "Passou um dia desde o início que você informou. Sem registros, o app não sabe se houve episódio. Marcar “hoje não roí” mostra o seu caminho de verdade.",
      acoes: ["registrar-gatilho"],
    },
    {
      chave: "3d",
      limiar: 3,
      titulo: "3 dias sem roer, conforme seus registros",
      texto:
        "Três dias registrados. Bom momento para deixar uma alternativa à mão nas situações em que você costuma roer, como uma bolinha antiestresse ou um objeto para manusear. Qual você quer testar?",
      tituloSemRegistro: "3 dias desde o início informado",
      textoSemRegistro:
        "Passaram três dias desde o início informado, mas faltam registros em alguns deles. Sem eles, o app não sabe se houve episódio.",
      acoes: ["escolher-alternativa"],
    },
    {
      chave: "7d",
      limiar: 7,
      titulo: "7 dias sem roer, conforme seus registros",
      texto:
        "Uma semana registrada. Repare no que mais ajudou: unhas curtas, esmalte amargo, algo para as mãos? Vale repetir o que funcionou.",
      tituloSemRegistro: "7 dias desde o início informado",
      textoSemRegistro:
        "Passou uma semana desde o início informado, com dias sem registro. Preencher o que você lembrar ajuda a enxergar o padrão.",
      acoes: ["registrar-gatilho", "ver-historico"],
    },
    {
      chave: "10d",
      limiar: 10,
      titulo: "10 dias sem roer, conforme seus registros",
      texto:
        "Dez dias registrados sem roer. Menos mordidas repetidas significam menos irritação contínua na pele e nas unhas. Não há prazo comprovado para a recuperação: cada pessoa tem o seu ritmo. O que você percebeu até aqui?",
      tituloSemRegistro: "10 dias desde o início informado",
      textoSemRegistro:
        "Passaram dez dias desde o início informado, mas há dias sem registro. O contador só afirma o que os seus registros sustentam.",
      acoes: ["registrar-como-estou", "registrar-gatilho"],
      afirmacoes: ["pele-e-unha"],
    },
    {
      chave: "14d",
      limiar: 14,
      titulo: "14 dias sem roer, conforme seus registros",
      texto:
        "Duas semanas registradas. Se a vontade apertar de novo, um episódio não apaga nada: ele mostra uma situação em que o hábito apareceu. O que aconteceu antes? Em estudos pequenos, perceber quando a mão vai à boca e trocar por outro gesto (reversão de hábito) ajudou as unhas a crescer.",
      tituloSemRegistro: "14 dias desde o início informado",
      textoSemRegistro:
        "Passaram duas semanas desde o início informado, com dias sem registro. Marcar os dias que faltam deixa o histórico fiel.",
      acoes: ["registrar-gatilho"],
      afirmacoes: ["reversao-de-habito"],
    },
    {
      chave: "30d",
      limiar: 30,
      titulo: "30 dias sem roer, conforme seus registros",
      texto:
        "Um mês de registros sem roer. Para ter uma referência: em média, a unha da mão cresce cerca de 3,5 mm por mês, segundo um estudo com adultos jovens saudáveis; o ritmo varia de pessoa para pessoa. Olhe o histórico: em quais situações foi mais fácil? Planeje o que fazer nas que ainda são difíceis. Se, mesmo com as estratégias, o hábito continuar difícil, conversar com um profissional é uma opção legítima.",
      tituloSemRegistro: "30 dias desde o início informado",
      textoSemRegistro:
        "Passou um mês desde o início informado, com dias sem registro. O histórico é seu: complete o que lembrar para ele refletir a realidade.",
      acoes: ["ver-historico"],
      afirmacoes: ["crescimento"],
      momentoDeConsulta: true,
    },
  ],

  estrategias: [
    {
      id: "unhas-curtas",
      titulo: "Mantenha as unhas curtas",
      texto: "Com as unhas aparadas, há menos o que morder e menos pontas que incomodam.",
      quando: ["unha grande", "pontinha", "irregular", "sobrando", "unha comprida"],
      fontes: ["aad-unhas"],
    },
    {
      id: "esmalte-amargo",
      titulo: "Teste um esmalte de gosto amargo",
      texto:
        "Existem esmaltes de gosto desagradável vendidos sem receita, feitos para desencorajar a mordida. A AAD os descreve como seguros.",
      quando: ["esmalte", "gosto", "amargo", "desencorajar"],
      fontes: ["aad-unhas", "bfrb-unhas"],
    },
    {
      id: "cobrir",
      titulo: "Cubra ou pinte as unhas",
      texto: "Esmalte colorido, fita ou luvas criam uma barreira física nos momentos de maior risco.",
      quando: ["automatico", "sem perceber", "dormindo", "assistindo", "tv", "celular"],
      fontes: ["aad-unhas"],
    },
    {
      id: "ocupar-maos",
      titulo: "Dê outra tarefa às mãos",
      texto:
        "Troque o gesto: uma bolinha antiestresse, um objeto para manusear ou, segundo a TLC, um petisco crocante podem ocupar o lugar do hábito.",
      quando: ["tedio", "trabalhando", "estudando", "reuniao", "maos", "ocupar"],
      fontes: ["aad-unhas", "bfrb-unhas"],
    },
    {
      id: "gatilhos",
      titulo: "Anote o que vem antes",
      texto:
        "Gatilhos podem ser físicos (uma pelinha, uma unha irregular) ou emocionais (tédio, estresse, ansiedade). Registrar quando e onde você rói mostra o padrão e permite planejar o que fazer em cada situação.",
      quando: ["gatilho", "quando", "por que roo", "situacao", "contexto"],
      fontes: ["aad-unhas", "bfrb-unhas"],
    },
    {
      id: "gradual",
      titulo: "Se fizer sentido, vá aos poucos",
      texto:
        "A AAD sugere parar de forma gradual: começar por um conjunto de unhas, como os polegares, e ir incluindo os outros até não morder nenhuma. É uma opção, não uma obrigação.",
      quando: ["de uma vez", "aos poucos", "gradual", "comecar por onde"],
      fontes: ["aad-unhas"],
    },
    {
      id: "respiracao",
      titulo: "Respire antes de agir",
      texto:
        "Quando a vontade vem junto com tensão, uma respiração lenta por alguns minutos pode dar espaço para escolher o que fazer. O NHS descreve um exercício simples, de pelo menos 5 minutos, que pode ser feito em qualquer lugar.",
      quando: ["tensao", "nervoso", "ansioso", "estresse", "prova", "reuniao"],
      fontes: ["nhs-respiracao"],
    },
    {
      id: "gentileza",
      titulo: "Seja paciente consigo",
      texto:
        "A TLC recomenda paciência e gentileza durante a mudança. Um episódio é informação para ajustar o plano, não um veredito sobre você.",
      quando: ["culpa", "falhei", "recai", "voltei", "desanimo", "roi de novo"],
      fontes: ["bfrb-unhas"],
    },
  ],

  faq: [
    {
      id: "por-que-parar",
      pergunta: "Por que vale a pena parar de roer unhas?",
      resposta:
        "Segundo AAD e TLC, morder as unhas com frequência pode machucar a pele ao redor, danificar o tecido que forma a unha, facilitar infecções e, com o tempo, afetar os dentes. Menos episódios significam menos dessas agressões. As fontes não prometem prazo de recuperação: o que dá para dizer é que cada episódio a menos é uma oportunidade a menos de contaminação e de irritação.",
      fontes: ["aad-unhas", "bfrb-unhas"],
      termos: ["por que parar", "vale a pena", "motivo", "beneficio", "adianta", "faz mal"],
    },
    {
      id: "perdi-progresso",
      pergunta: "Roí uma unha hoje. Perdi todo o progresso?",
      resposta:
        "Não. Tudo que você registrou continua no histórico: os dias, os gatilhos, as alternativas que testou. O contador de “dias sem roer” recomeça a partir do episódio, mas nada é apagado. Um episódio é informação: o que aconteceu antes dele? Responder isso ajuda no próximo dia. Retomar já é o que o seu histórico vai mostrar.",
      termos: ["roi", "perdi", "progresso", "recaida", "voltei", "episodio", "falhei", "de novo"],
    },
    {
      id: "ja-recuperou",
      pergunta: "Estou há dias sem roer. Minhas unhas já se recuperaram?",
      resposta:
        "O app não consegue dizer isso. O contador mostra os dias que você registrou, não o estado das suas unhas, e as fontes consultadas (AAD e TLC) não informam quanto tempo a pele e as unhas levam para se recuperar. Quem pode avaliar é você, olhando as suas unhas, e um dermatologista, se quiser uma opinião profissional.",
      fontes: ["aad-unhas", "bfrb-unhas"],
      termos: ["recuperou", "recuperadas", "recuperar", "cicatrizar", "ja melhorou", "melhorou"],
    },
    {
      id: "quanto-cresce",
      pergunta: "Quanto tempo a unha leva para crescer?",
      resposta:
        "Em média, a unha da mão cresce cerca de 3,5 mm por mês (perto de 0,1 mm por dia), segundo um estudo com adultos jovens saudáveis dos EUA. O ritmo varia com a idade, o dedo e a pessoa. Isso é o crescimento da unha, não um prazo para a pele ao redor ou para a unha voltar ao aspecto de antes: as fontes consultadas não dão esse prazo.",
      fontes: ["bionumbers-unhas"],
      termos: ["crescer", "cresce", "quanto tempo", "milimetros", "tamanho", "comprimento"],
    },
    {
      id: "sinal-de-ansiedade",
      pergunta: "Roer unha é sinal de ansiedade?",
      resposta:
        "A AAD cita tédio, estresse e ansiedade entre os gatilhos possíveis e diz que o hábito pode, em alguns casos, estar ligado a um problema psicológico ou emocional. Mas roer unhas, por si só, não indica nenhuma condição, e o app não faz diagnóstico. Se o hábito vem com muito sofrimento, ou se você já tentou parar várias vezes sem sucesso, conversar com um médico é um bom caminho.",
      fontes: ["aad-unhas"],
      termos: ["ansiedade", "ansioso", "toc", "doenca", "psicologico", "emocional", "transtorno"],
    },
    {
      id: "infeccao",
      pergunta: "Roer unha pode causar infecção?",
      resposta:
        "Pode aumentar a chance: segundo a AAD, morder move bactérias e vírus da boca para os dedos e dos dedos para o rosto, e a TLC descreve a paroníquia, uma infecção com inchaço vermelho e doloroso, às vezes com pus. Se a pele ao redor da unha ficar vermelha, inchada, dolorida ou com pus, procure atendimento; a AAD indica um dermatologista.",
      fontes: ["aad-unhas", "bfrb-unhas"],
      termos: ["infeccao", "pus", "inchada", "vermelha", "dor", "paroniquia", "machucou", "sangrando"],
    },
    {
      id: "de-uma-vez",
      pergunta: "Devo parar de uma vez ou aos poucos?",
      resposta:
        "A AAD sugere a via gradual: começar por um conjunto de unhas, como os polegares, e ir incluindo os outros. As fontes consultadas não comparam os dois jeitos, então a escolha é sua: o que parece mais viável para você agora?",
      fontes: ["aad-unhas"],
      termos: ["de uma vez", "aos poucos", "gradual", "como parar", "por onde comecar", "comecar"],
    },
    {
      id: "sem-perceber",
      pergunta: "E se eu roer sem perceber?",
      resposta:
        "É comum, e é por isso que ajudam as barreiras físicas (esmalte, fita, luvas) e anotar em que situações acontece. A AAD recomenda identificar os gatilhos para planejar como evitá-los; o registro de “vontade” e de “episódio” no app serve a isso.",
      fontes: ["aad-unhas"],
      termos: ["sem perceber", "automatico", "sem querer", "inconsciente", "nem vejo"],
    },
  ],

  dificuldades: [
    {
      id: "automatico",
      titulo: "Roer sem perceber",
      texto: "O gesto vira automático. Barreiras físicas e um objeto para as mãos ajudam a interromper o piloto automático.",
    },
    {
      id: "tensao-tedio",
      titulo: "Momentos de tensão ou tédio",
      texto: "Trabalho, estudo, telas e esperas costumam concentrar os episódios. Escolher uma alternativa específica para cada um funciona melhor do que “tentar não roer”.",
    },
    {
      id: "pelinhas",
      titulo: "Pelinhas e unhas irregulares",
      texto: "Uma pelinha ou uma ponta irregular pode funcionar como gatilho físico. Aparar em vez de morder tira esse gatilho de cena.",
    },
    {
      id: "culpa",
      titulo: "Culpa depois de um episódio",
      texto: "Sentir culpa é comum, mas não ajuda a mudar. Tratar o episódio como informação — o que aconteceu antes? — costuma ser mais útil do que se cobrar.",
    },
  ],

  sinaisDeAjuda: [
    {
      texto:
        "Dor, vermelhidão, inchaço ou pus ao redor da unha podem indicar infecção. Procure atendimento; a AAD indica um dermatologista.",
      nivel: "converse-com-profissional",
      fontes: ["aad-unhas", "bfrb-unhas"],
    },
    {
      texto:
        "Se você já tentou parar várias vezes e o hábito continua, conversar com um médico é um passo válido. A AAD observa que, às vezes, o hábito pode estar ligado a um problema psicológico ou emocional.",
      nivel: "converse-com-profissional",
      fontes: ["aad-unhas"],
    },
    {
      texto:
        "Se o hábito vem acompanhado de muito sofrimento, vergonha intensa ou tristeza que não passa, procure um profissional de saúde mental. Se precisar conversar agora, o CVV atende pelo 188, 24 horas, gratuitamente.",
      nivel: "converse-com-profissional",
      fontes: ["cvv"],
    },
  ],

  limites: [
    "O app não diagnostica ansiedade, TOC nem qualquer outra condição a partir de roer unhas.",
    "O app não informa quanto tempo as unhas e a pele levam para se recuperar: nenhuma fonte consultada traz esse prazo.",
    "Não ter registro não prova que o comportamento não aconteceu: o contador só reflete o que você informou.",
    "O número de dias sem roer não mede cicatrização, estado das unhas nem risco de infecção, e o app não diz que as unhas “estão recuperadas”.",
    "Os marcos de 1, 3, 7, 10, 14 e 30 dias organizam a jornada; não são prazos comprovados de nada.",
  ],

  oQueObservar: [
    "Em que situações a vontade aparece: trabalho, estudo, tédio, tensão ou outra.",
    "Quais alternativas ajudaram a ocupar as mãos e quais não.",
    "Como estão a pele ao redor e o aspecto das unhas, pela sua própria percepção.",
    "Quantos episódios acontecem por semana, e se isso muda com o tempo.",
  ],

  rastreio: { tipo: "episodios", unidade: "dias" },
  versao: 1,
  revisadoEm: "2026-10-27",
  status: "fontes-conferidas",
  notaEditorial:
    "Fontes lidas: AAD (12/04/2024) e TLC/BFRB (28/03/2025). Nenhuma informa recuperação ou prazo, então o tema não afirma nenhum. A fonte brasileira (BVS/Ministério da Saúde) retornou HTTP 503 e não foi lida. Não houve revisão por dermatologista ou psicólogo.",
};
