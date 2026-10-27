import type { Tema } from "../tipos.ts";

/**
 * Escitalopram — conhecimento sobre o medicamento, SEPARADO dos hábitos de abstinência.
 *
 * Fontes lidas: bula brasileira (Novartis, genérico, Bula Padrão aprovada pela Anvisa
 * em 05/12/2024), MedlinePlus (rev. 15/10/2025) e NHS (rev. 18/06/2026). Quando elas
 * divergem, vale a brasileira — e o texto diz que divergem.
 *
 * Nada aqui é dose recomendada. A dose de cada pessoa é um DADO DELA (tabela
 * DoseTratamento), nunca conteúdo do catálogo. Nenhum dado pessoal mora neste arquivo.
 *
 * Padrão dos marcos: o título forte ("N dias consecutivos com tomada registrada") só
 * aparece com N dias consecutivos confirmados; senão, o título fraco ("N dias desde o
 * início informado"), que diz apenas o que o calendário sustenta.
 */
export const escitalopram: Tema = {
  id: "escitalopram",
  categoria: "medicamento",
  titulo: "Escitalopram",
  nomesAlternativos: ["oxalato de escitalopram", "lexapro", "escena"],
  termos: [
    "antidepressivo",
    "isrs",
    "remedio",
    "medicamento",
    "comprimido",
    "tomada",
    "psiquiatra",
    "tratamento",
    "serotonina",
    "efeito colateral",
  ],
  descricao:
    "Informações educativas sobre o escitalopram e um registro simples de tomadas, doses informadas e efeitos que você notar. O app não prescreve, não avalia a sua dose e não mede resposta ao tratamento: ele ajuda você a organizar o que observa para conversar com quem acompanha o seu tratamento.",
  objetivos: [
    "Registrar a tomada com regularidade, sem pressão",
    "Observar humor, sono e bem-estar ao longo do tempo",
    "Levar informações organizadas para a conversa com o profissional",
    "Reconhecer sinais que justificam procurar ajuda",
  ],

  beneficios: [
    {
      id: "finalidade",
      texto:
        "O escitalopram é um antidepressivo da classe dos inibidores seletivos da recaptação de serotonina (ISRS). A bula brasileira o indica para o tratamento e a prevenção de recaída da depressão, o transtorno do pânico, o transtorno de ansiedade generalizada, a ansiedade social e o transtorno obsessivo compulsivo.",
      fontes: ["bula-escitalopram-br", "nhs-escitalopram"],
      ressalva:
        "O app não sabe por que você usa o medicamento e não presume nenhum diagnóstico: quem define a indicação no seu caso é o profissional que o prescreveu.",
    },
    {
      id: "tempo-de-efeito",
      texto:
        "O efeito leva tempo e varia de pessoa para pessoa: a bula brasileira diz que pode demorar cerca de duas semanas até a pessoa começar a se sentir melhor, enquanto o NHS e o MedlinePlus falam em várias semanas até o benefício completo.",
      fontes: ["bula-escitalopram-br", "nhs-escitalopram", "medlineplus-escitalopram"],
      ressalva: "Nenhum marco do app indica, por si só, como será a sua resposta.",
    },
    {
      id: "efeitos-frequentes",
      texto:
        "Segundo a bula, náusea e dor de cabeça são os efeitos mais frequentes (mais de 1 em cada 10 pessoas). Também são comuns alterações do apetite, do sono e da energia, boca seca, suor aumentado, tontura e mudanças na vida sexual. A bula diz que os efeitos costumam ser leves e desaparecer em alguns dias, e o NHS diz que a maioria melhora em algumas semanas — mas alguns duram mais.",
      fontes: ["bula-escitalopram-br", "nhs-escitalopram"],
      ressalva:
        "Isso não vale para todo sintoma nem para todas as pessoas. A própria bula lembra que muitos sintomas podem ser da doença e não do medicamento.",
    },
    {
      id: "sono-e-medicamento",
      texto:
        "Entre os efeitos comuns descritos na bula estão dificuldade para dormir, sonolência durante o dia e sonhos anormais. Por isso, observar o sono ao longo do tratamento é útil e vale levar esse registro ao profissional.",
      fontes: ["bula-escitalopram-br", "nhs-escitalopram"],
      ressalva:
        "O app mostra o que você registrou sobre o sono, mas não consegue dizer se uma mudança vem do medicamento, da condição ou de outra coisa.",
    },
    {
      id: "piora-e-ajuda",
      texto:
        "A bula orienta procurar o médico se a pessoa não se sentir melhor ou se sentir pior. Pensamentos de se machucar ou de acabar com a vida podem aumentar no início do uso de um antidepressivo, e a bula pede contato com o médico ou ida a um hospital imediatamente. Em estudos, o risco de comportamento suicida foi maior em adultos com menos de 25 anos.",
      fontes: ["bula-escitalopram-br", "medlineplus-escitalopram"],
    },
    {
      id: "nao-interromper",
      texto:
        "A bula orienta não interromper o uso até que o médico diga. Ao final do tratamento, a dose costuma ser reduzida aos poucos, ao longo de algumas semanas. Parar de repente pode causar sintomas de descontinuação, como tontura, sensação de choque ou agulhadas, alterações do sono, ansiedade, dor de cabeça e náusea.",
      fontes: ["bula-escitalopram-br", "nhs-escitalopram", "medlineplus-escitalopram"],
    },
    {
      id: "sem-vicio",
      texto: "A bula afirma que os sintomas de descontinuação não indicam vício.",
      fontes: ["bula-escitalopram-br"],
    },
    {
      id: "dose-do-medico",
      texto:
        "Quem define a dose é o médico. Ela pode começar menor e ser ajustada ao longo de semanas conforme a indicação e a resposta de cada pessoa (bula brasileira e NHS).",
      fontes: ["bula-escitalopram-br", "nhs-escitalopram"],
    },
    {
      id: "alcool",
      texto:
        "A bula diz que o escitalopram não potencializa os efeitos do álcool, mas recomenda não ingerir álcool durante o tratamento.",
      fontes: ["bula-escitalopram-br"],
    },
  ],

  marcos: [
    {
      chave: "1d",
      limiar: 1,
      titulo: "1 dia com tomada registrada",
      texto:
        "Você registrou a tomada de hoje. Náusea e dor de cabeça estão entre os efeitos mais frequentes segundo a bula, e muitos costumam ser leves. Anote o que notar; se algo incomodar muito ou não passar, fale com o médico ou o farmacêutico.",
      tituloSemRegistro: "1 dia desde o início informado",
      textoSemRegistro:
        "Passou 1 dia desde o início informado do tratamento, sem registro de tomada. Sem registro, o app não sabe se houve ou não tomada — e não presume nada.",
      acoes: ["registrar-efeito"],
      afirmacoes: ["efeitos-frequentes"],
    },
    {
      chave: "3d",
      limiar: 3,
      titulo: "3 dias consecutivos com tomada registrada",
      texto:
        "Você registrou a tomada por 3 dias seguidos. Sono, apetite e energia podem mudar por causa do tratamento ou da própria condição, e o app não distingue uma coisa da outra. Que tal anotar como eles estão?",
      tituloSemRegistro: "3 dias desde o início informado",
      textoSemRegistro:
        "Passaram 3 dias desde o início informado, mas há dias sem informação. Dia sem registro não quer dizer que a tomada não aconteceu; só que o app não sabe.",
      acoes: ["registrar-como-estou"],
      afirmacoes: ["sono-e-medicamento"],
    },
    {
      chave: "7d",
      limiar: 7,
      titulo: "7 dias consecutivos com tomada registrada",
      texto:
        "Uma semana de registros seguidos. Você já tem material para observar o seu padrão. O efeito do escitalopram leva algumas semanas (a bula cita cerca de duas; NHS e MedlinePlus falam em várias), então uma semana, sozinha, não diz como o tratamento vai ser para você.",
      tituloSemRegistro: "7 dias desde o início informado",
      textoSemRegistro:
        "Passou uma semana desde o início informado, com dias sem informação. Completar o que você lembrar deixa o histórico fiel; o que não lembrar fica como “sem informação”.",
      acoes: ["registrar-como-estou", "ver-historico"],
      afirmacoes: ["tempo-de-efeito"],
    },
    {
      chave: "10d",
      limiar: 10,
      titulo: "10 dias consecutivos com tomada registrada",
      texto:
        "Você registrou a tomada por 10 dias seguidos. O efeito do escitalopram pode levar várias semanas; este marco, sozinho, não determina sua resposta ao tratamento. Como ficaram seu humor, sono e bem-estar nesse período?",
      tituloSemRegistro: "10 dias desde o início informado",
      textoSemRegistro:
        "Passaram 10 dias desde o início informado, mas há dias sem informação. O contador só afirma o que os seus registros sustentam.",
      acoes: ["registrar-como-estou", "ver-historico"],
      afirmacoes: ["tempo-de-efeito"],
    },
    {
      chave: "14d",
      limiar: 14,
      titulo: "14 dias consecutivos com tomada registrada",
      texto:
        "Duas semanas de registros seguidos. A bula cita cerca de duas semanas para começar a se sentir melhor, e outras fontes falam em várias; muda de pessoa para pessoa. Compare com o início usando as suas anotações. Se você se sente pior em vez de melhor, ou surgirem pensamentos de se machucar, procure o médico — não espere.",
      tituloSemRegistro: "14 dias desde o início informado",
      textoSemRegistro:
        "Passaram duas semanas desde o início informado, com dias sem informação. Registrar como você está hoje já é útil, mesmo sem completar os dias anteriores.",
      acoes: ["registrar-como-estou", "preparar-consulta"],
      afirmacoes: ["tempo-de-efeito", "piora-e-ajuda"],
      momentoDeConsulta: true,
    },
    {
      chave: "21d",
      limiar: 21,
      titulo: "21 dias consecutivos com tomada registrada",
      texto:
        "Três semanas de registros seguidos. Vale olhar o histórico: dias com e sem informação, efeitos que você anotou, sono e humor. Esse resumo pode ser levado ao profissional responsável.",
      tituloSemRegistro: "21 dias desde o início informado",
      textoSemRegistro:
        "Passaram três semanas desde o início informado, com dias sem informação. Mesmo assim, o resumo do que você registrou pode ajudar na conversa com o profissional.",
      acoes: ["preparar-consulta", "ver-historico"],
      momentoDeConsulta: true,
    },
    {
      chave: "30d",
      limiar: 30,
      titulo: "30 dias consecutivos com tomada registrada",
      texto:
        "Um mês de registros seguidos. Este marco organiza a conversa com o profissional: como foram humor, sono e efeitos? O que ele precisa saber? Ajustes de dose ou de tratamento são decisão dele; o app só ajuda a registrar.",
      tituloSemRegistro: "30 dias desde o início informado",
      textoSemRegistro:
        "Passou um mês desde o início informado, com dias sem informação. O que você registrou continua sendo uma boa base para a conversa com o profissional.",
      acoes: ["preparar-consulta"],
      afirmacoes: ["dose-do-medico"],
      momentoDeConsulta: true,
    },
    {
      chave: "42d",
      limiar: 42,
      titulo: "42 dias consecutivos com tomada registrada",
      texto:
        "Seis semanas de registros seguidos. Se houver uma consulta de retorno marcada, leve as suas anotações. Se não houver e você tem dúvidas sobre como as coisas estão indo, pode ser um bom momento para marcar uma.",
      tituloSemRegistro: "42 dias desde o início informado",
      textoSemRegistro:
        "Passaram seis semanas desde o início informado, com dias sem informação. Se houver consulta, leve o que registrou — e diga ao profissional quais dias ficaram sem registro.",
      acoes: ["preparar-consulta", "ver-historico"],
      momentoDeConsulta: true,
    },
    {
      chave: "60d",
      limiar: 60,
      titulo: "60 dias consecutivos com tomada registrada",
      texto:
        "Dois meses de registros seguidos. O app não avalia resposta ao tratamento: a comparação com o início é sua e do profissional. Não interrompa o tratamento por conta própria; qualquer decisão sobre parar ou mudar a dose é do médico.",
      tituloSemRegistro: "60 dias desde o início informado",
      textoSemRegistro:
        "Passaram dois meses desde o início informado, com dias sem informação. Dias sem registro não significam que o medicamento não foi tomado; significam que o app não sabe.",
      acoes: ["registrar-como-estou", "preparar-consulta"],
      afirmacoes: ["nao-interromper"],
      momentoDeConsulta: true,
    },
  ],

  estrategias: [
    {
      id: "horario-fixo",
      titulo: "Ligue o registro a um momento fixo do dia",
      texto: "Registrar sempre junto de algo que você já faz (o café, escovar os dentes) ajuda a não esquecer o registro.",
      quando: ["esqueço de registrar", "esqueci de registrar", "registrar", "lembrar"],
    },
    {
      id: "lembrete-discreto",
      titulo: "Use um lembrete discreto",
      texto:
        "O app pode lembrar você de registrar sem mostrar o nome do medicamento na tela bloqueada. Esse lembrete vem desligado: só você liga, e só você escolhe se o texto mostra detalhes.",
      quando: ["lembrete", "notificacao", "alarme", "tela bloqueada", "privacidade"],
    },
    {
      id: "organizador",
      titulo: "Um organizador semanal de comprimidos",
      texto: "Quando há dúvida se já tomou hoje, ver o compartimento do dia no organizador responde sem depender da memória.",
      quando: ["ja tomei", "nao lembro se tomei", "duvida", "esquecer", "esqueci"],
    },
    {
      id: "anotar-efeitos",
      titulo: "Anote efeitos e quando começaram",
      texto:
        "Escrever o que sentiu, quando começou e o quanto incomodou torna a conversa com o médico mais concreta. O registro de efeitos do app serve a isso.",
      quando: ["efeito", "sintoma", "enjoo", "dor de cabeca", "sinto", "senti", "incomoda"],
    },
    {
      id: "resumo-consulta",
      titulo: "Leve um resumo para a consulta",
      texto:
        "Um resumo com início do tratamento, doses informadas, dias com e sem registro, efeitos anotados e o que você percebeu de humor e sono ajuda o profissional a ter um retrato mais completo.",
      quando: ["consulta", "medico", "psiquiatra", "retorno", "conversar", "levar"],
    },
    {
      id: "perguntas",
      titulo: "Tenha as perguntas escritas",
      texto:
        "Escreva antes da consulta: o que mudou desde a última vez, quais efeitos preocupam, o que fazer se esquecer uma tomada, por quanto tempo está previsto o acompanhamento.",
      quando: ["pergunta", "duvida", "consulta", "preparar"],
    },
    {
      id: "contar-a-alguem",
      titulo: "Conte a alguém de confiança",
      texto:
        "A bula sugere dizer a um parente ou amigo próximo que você está em tratamento e pedir que avise se perceber piora ou mudanças no seu comportamento.",
      quando: ["sozinho", "ninguem sabe", "contar", "familia", "amigo", "pior"],
      fontes: ["bula-escitalopram-br"],
    },
    {
      id: "sono-humor",
      titulo: "Registre sono e humor em horários parecidos",
      texto:
        "Anotar sempre no mesmo momento do dia deixa a comparação mais justa. O app mostra o que você registrou e não conclui o que causou cada mudança.",
      quando: ["sono", "humor", "dormir", "comparar", "melhorou", "piorou"],
    },
  ],

  faq: [
    {
      id: "dez-dias-o-que-melhorou",
      pergunta: "Estou há 10 dias tomando escitalopram. O que já melhorou?",
      resposta:
        "O app não sabe o que melhorou: ele só mostra o que você registrou. Dez dias costumam ser cedo — a bula brasileira cita cerca de duas semanas para começar a se sentir melhor e o NHS e o MedlinePlus falam em várias semanas, variando de pessoa para pessoa. O que dá para fazer agora é observar: como estão humor, sono e bem-estar nos seus registros? Se algo piorou ou preocupa, fale com o seu médico.",
      fontes: ["bula-escitalopram-br", "nhs-escitalopram", "medlineplus-escitalopram"],
      termos: ["o que ja melhorou", "ja melhorou", "10 dias", "dez dias", "quando faz efeito", "quanto tempo", "demora", "ja deveria", "nao senti nada"],
    },
    {
      id: "esqueci-de-registrar",
      pergunta: "Esqueci de registrar ontem. Perdi minha sequência?",
      resposta:
        "Você não perdeu o tratamento nem o histórico. O que muda é só a contagem de “dias consecutivos com tomada registrada”: um dia sem informação interrompe essa sequência porque o app não sabe se você tomou — não porque você falhou. Se lembrar, registre ontem agora e a sequência é recalculada. O total de dias registrados e o tempo desde o início continuam como estavam. Esquecer de registrar não é esquecer de tomar, e nada no tratamento depende dessa sequência.",
      termos: ["esqueci de registrar", "perdi", "sequencia", "registrar ontem", "streak", "perdi a sequencia", "quebrou"],
    },
    {
      id: "esqueci-de-tomar",
      pergunta: "Esqueci de tomar. O que eu faço?",
      resposta:
        "A bula brasileira orienta: se você lembrou até antes de deitar, pode tomar excepcionalmente naquele momento e, no dia seguinte, retomar o horário de sempre; se lembrou só no meio da noite ou no dia seguinte, ignore a dose esquecida e siga como de costume. Não tome em dobro. Em dúvida, procure o farmacêutico ou o seu médico. Em outros países a orientação pode ser um pouco diferente; vale a bula do seu medicamento. O app não calcula compensações.",
      fontes: ["bula-escitalopram-br"],
      termos: ["esqueci de tomar", "esqueci a dose", "dose esquecida", "esquecimento", "dobro", "tomar em dobro", "nao tomei", "pulei"],
    },
    {
      id: "mudei-a-dose",
      pergunta: "Mudei a dose há 3 dias, mas comecei o tratamento há um mês.",
      resposta:
        "O app guarda as duas datas separadas: início do tratamento há cerca de um mês e início da dose atual há 3 dias. Informar a nova dose acrescenta uma linha ao histórico; nada é apagado e nada recomeça. O app não calcula nova previsão de efeito. Mudanças de dose são decisão do médico: se foi ele quem orientou, registre; se mudou por conta própria, vale contar a ele. Nos próximos dias, observe e anote como se sente.",
      fontes: ["bula-escitalopram-br", "nhs-escitalopram"],
      termos: ["mudei a dose", "aumentei a dose", "dose nova", "dose atual", "aumentaram", "diminuiram", "troquei a dose", "mudou a dose"],
    },
    {
      id: "pior-desde-que-comecei",
      pergunta: "Estou pior desde que comecei.",
      resposta:
        "Obrigado por contar. Sentir-se pior — mais ansioso, agitado, triste ou com pensamentos de se machucar — deve ser dito ao médico logo: a bula orienta procurar o médico se você não se sentir melhor ou se sentir pior, e o início do tratamento e as mudanças de dose merecem atenção. O app não consegue saber se é o medicamento, a condição ou outra coisa. Se houver pensamentos de se machucar ou de acabar com a vida, procure atendimento hospitalar imediatamente, ligue 192 (SAMU) ou 188 (CVV, 24 horas, gratuito).",
      fontes: ["bula-escitalopram-br", "medlineplus-escitalopram", "cvv"],
      termos: ["pior", "piorei", "piorou", "desde que comecei", "nao melhorei", "mais ansioso", "mais triste", "agitado", "pensamentos"],
    },
    {
      id: "para-que-serve",
      pergunta: "Para que serve o escitalopram?",
      resposta:
        "É um antidepressivo (ISRS). A bula brasileira o indica para depressão (tratamento e prevenção de recaída), transtorno do pânico, ansiedade generalizada, ansiedade social e TOC. O app não sabe por que você usa e não presume nada: a indicação no seu caso é de quem prescreveu.",
      fontes: ["bula-escitalopram-br", "nhs-escitalopram"],
      termos: ["para que serve", "serve para", "indicacao", "indicado", "depressao", "ansiedade", "toc", "panico", "o que e"],
    },
    {
      id: "efeitos-comuns",
      pergunta: "Quais são os efeitos colaterais mais comuns?",
      resposta:
        "Segundo a bula, náusea e dor de cabeça são os mais frequentes. Também são comuns mudanças no apetite, no sono, na energia, boca seca, suor aumentado, tontura e mudanças na vida sexual. Muitos costumam ser leves e passar em dias ou semanas, mas não todos. Qualquer efeito que incomode ou não passe merece conversa com o médico ou o farmacêutico — não é preciso “aguentar”. O registro de efeitos do app ajuda a descrevê-los.",
      fontes: ["bula-escitalopram-br", "nhs-escitalopram"],
      termos: ["efeito colateral", "efeitos colaterais", "efeitos", "enjoo", "nausea", "dor de cabeca", "suor", "sexual", "sono", "tontura"],
    },
    {
      id: "posso-beber",
      pergunta: "Posso beber álcool?",
      resposta:
        "A bula brasileira diz que o escitalopram não potencializa os efeitos do álcool, mas recomenda não ingerir álcool durante o tratamento. Converse com o seu médico sobre o seu caso.",
      fontes: ["bula-escitalopram-br"],
      termos: ["alcool", "bebida", "beber", "cerveja", "vinho", "bebo"],
    },
    {
      id: "posso-parar",
      pergunta: "Posso parar quando me sentir bem?",
      resposta:
        "Não pare por conta própria. A bula e o NHS orientam falar com o médico antes: parar de repente pode causar sintomas de descontinuação, e o usual é reduzir aos poucos, ao longo de semanas. Sentir-se melhor é um bom assunto para levar à consulta — a decisão sobre parar é do médico.",
      fontes: ["bula-escitalopram-br", "nhs-escitalopram", "medlineplus-escitalopram"],
      termos: ["parar", "interromper", "suspender", "me senti bem", "melhorei", "largar", "deixar de tomar", "parei"],
    },
    {
      id: "vicia",
      pergunta: "Escitalopram vicia?",
      resposta:
        "A bula brasileira afirma que os sintomas de descontinuação não indicam vício; por isso a retirada costuma ser gradual, com o médico. Se você tem receio de depender, converse sobre isso na consulta.",
      fontes: ["bula-escitalopram-br"],
      termos: ["vicia", "vicio", "dependencia", "dependente", "abstinencia", "largar depois"],
    },
    {
      id: "citalopram",
      pergunta: "Escitalopram e citalopram são a mesma coisa?",
      resposta:
        "São medicamentos diferentes, e o app só tem conteúdo sobre o escitalopram. Se você usa citalopram, as informações daqui não valem automaticamente para você: confira a bula do seu medicamento e converse com o profissional.",
      termos: ["citalopram", "mesma coisa", "diferenca", "troquei", "generico", "similar"],
    },
    {
      id: "quanto-tempo-tomar",
      pergunta: "Por quanto tempo vou tomar?",
      resposta:
        "A duração é definida pelo médico para cada caso, de acordo com o motivo do tratamento e a sua resposta. O app não estima nem sugere prazo.",
      fontes: ["bula-escitalopram-br"],
      termos: ["quanto tempo vou tomar", "por quanto tempo", "ate quando", "duracao", "para sempre", "tomar a vida toda"],
    },
  ],

  dificuldades: [
    {
      id: "esquecer-de-registrar",
      titulo: "Esquecer de registrar",
      texto: "Acontece. Registrar junto de um momento fixo do dia ajuda; e dá para completar dias anteriores depois.",
    },
    {
      id: "nao-notar-diferenca",
      titulo: "Não notar diferença no começo",
      texto: "O efeito leva tempo e varia. Anotar como você está, em vez de procurar uma mudança, ajuda a ver o conjunto.",
    },
    {
      id: "efeitos-que-incomodam",
      titulo: "Efeitos que incomodam",
      texto: "Não precisa aguentar em silêncio: anote quando começaram e o quanto incomodam, e fale com o médico ou o farmacêutico.",
    },
    {
      id: "causa-incerta",
      titulo: "Não saber se é o remédio ou outra coisa",
      texto: "Nem o app nem você conseguem separar isso sozinhos. Descrever o que sente ao profissional é o caminho.",
    },
    {
      id: "estigma",
      titulo: "Vergonha ou receio de contar",
      texto: "Tratamento é cuidado, não fraqueza. Se ajudar, conte a uma pessoa de confiança — a bula chega a sugerir isso.",
    },
  ],

  sinaisDeAjuda: [
    {
      texto:
        "Pensamentos de se machucar ou de acabar com a vida: procure atendimento hospitalar imediatamente ou ligue 192 (SAMU). Para conversar agora, o CVV atende pelo 188, 24 horas, gratuitamente. A bula orienta contatar o médico ou ir a um hospital imediatamente.",
      nivel: "urgencia",
      fontes: ["bula-escitalopram-br", "cvv"],
    },
    {
      texto:
        "Convulsão, desmaio, confusão intensa, febre com rigidez muscular, batimentos acelerados ou irregulares, sangramento anormal, ou reação alérgica (inchaço no rosto ou na garganta, dificuldade para respirar ou engolir): são situações listadas como graves pelo MedlinePlus e pelo NHS. Procure atendimento de urgência (SAMU, 192).",
      nivel: "urgencia",
      fontes: ["medlineplus-escitalopram", "nhs-escitalopram"],
    },
    {
      texto:
        "Piora do humor, ansiedade intensa, agitação, inquietação ou sensação de não conseguir ficar parado, principalmente nas primeiras semanas ou quando a dose muda: fale com o médico logo.",
      nivel: "converse-com-profissional",
      fontes: ["bula-escitalopram-br", "medlineplus-escitalopram"],
    },
    {
      texto:
        "Sintomas ao esquecer ou parar o medicamento (tontura, sensação de choque ou agulhadas, alterações do sono, ansiedade, náusea): contate o médico. A bula orienta não interromper por conta própria.",
      nivel: "converse-com-profissional",
      fontes: ["bula-escitalopram-br"],
    },
    {
      texto:
        "Efeitos que incomodam ou que não passam: converse com o médico ou o farmacêutico. Continue o tratamento a menos que o profissional oriente o contrário.",
      nivel: "converse-com-profissional",
      fontes: ["nhs-escitalopram"],
    },
    {
      texto:
        "Menos de 25 anos, ou história de pensamentos de se machucar: a bula aponta risco maior no início do tratamento. Vale um acompanhamento mais próximo e avisar alguém de confiança.",
      nivel: "converse-com-profissional",
      fontes: ["bula-escitalopram-br"],
    },
  ],

  limites: [
    "A dose que você informa, qualquer que seja, é um dado do seu acompanhamento: o app não a recomenda, não a avalia e não a compara com outras.",
    "O app não recomenda começar, aumentar, reduzir ou suspender o medicamento, nem mudar o horário por conta própria.",
    "Dias de tomada registrados mostram regularidade de REGISTRO, não resposta ao tratamento.",
    "O app não sabe se um sintoma vem do medicamento, da condição ou de outra coisa, e não afirma causa a partir de coincidência no tempo.",
    "O app não calcula compensação de dose esquecida nem previsão de quando o efeito vai começar.",
    "O app não presume o seu diagnóstico: o escitalopram tem várias indicações.",
    "A sequência de dias é uma organização do registro, não cobrança, e não dá pontos por dose maior ou por tomada extra.",
    "A bula do seu medicamento específico prevalece sobre o conteúdo do app; o app usa a bula padrão de um genérico como referência.",
  ],

  oQueObservar: [
    "Como estão humor, ansiedade e energia ao longo da semana, nas suas próprias palavras.",
    "Como está o sono: hora de dormir, de acordar e a qualidade percebida.",
    "Apetite e quaisquer efeitos indesejados: quando começaram, quanto incomodam, se passam.",
    "Dias sem informação — para saber o que o registro realmente cobre.",
    "Mudanças de dose e o que você percebeu depois, sem concluir a causa.",
  ],

  rastreio: { tipo: "medicamento" },
  versao: 1,
  revisadoEm: "2026-10-27",
  status: "fontes-conferidas",
  notaEditorial:
    "Fontes lidas: bula brasileira do genérico (Novartis, Bula Padrão Anvisa de 05/12/2024), MedlinePlus (15/10/2025) e NHS (18/06/2026). A fonte HSE indicada retornou HTTP 403 e NÃO foi lida; o Bulário Eletrônico da Anvisa não foi consultado, então a versão vigente do medicamento de cada pessoa deve ser conferida na bula da caixa. Telefones de emergência dos EUA e do Reino Unido não foram usados (o app usa SAMU 192 e CVV 188). Não houve revisão por médico ou farmacêutico: o conteúdo é informativo e não substitui orientação profissional.",
};
