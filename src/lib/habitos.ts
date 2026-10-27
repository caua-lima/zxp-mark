/**
 * Catálogo de hábitos e a linha do tempo de marcos de cada um.
 *
 * Cada marco vira: um item na trilha dentro do app + uma notificação push
 * disparada no instante exato em que a pessoa o atinge.
 *
 * REVISÃO DE CONTEÚDO (2026-10-26)
 * Os textos anteriores afirmavam prazos de recuperação como se valessem para
 * todo mundo ("nicotina zero em 72h", "o cérebro reorganiza em 90 dias", "21
 * dias para virar automático", "risco de infarto igual ao de quem nunca
 * fumou em 2 anos") — vários contrariam as fontes oficiais. Regra agora:
 *
 *   - `corpo` fala de constância, gatilhos e do que a pessoa fez. Não promete
 *     recuperação nem dá prazo universal.
 *   - Afirmação de saúde só entra com fonte, e fica em `./beneficios.ts`
 *     (com referência e data de revisão). Para o cigarro, onde há fonte, o
 *     `corpo` repete o texto dessa afirmação e diz "segundo o CDC/NHS".
 *   - Sem suporte verificado → mensagem factual sobre o registro ou a rotina.
 *
 * As `chave`s, os tempos e os títulos NÃO mudam: a chave deduplica notificações
 * já enviadas (Enviada), e mexer nela reenviaria tudo.
 */

import { unhas as temaUnhas } from "./conhecimento/temas/unhas.ts";

export const MIN = 60_000;
export const HORA = 60 * MIN;
export const DIA = 24 * HORA;
export const SEMANA = 7 * DIA;
export const MES = 30 * DIA;
export const ANO = 365 * DIA;

export type MarcoDef = {
  /** identificador estável usado para deduplicar notificações */
  chave: string;
  /** quanto tempo depois do início do ciclo */
  ms: number;
  /** título da notificação */
  titulo: string;
  /** corpo da notificação — constância e gatilhos; saúde só com fonte */
  corpo: string;
};

export type Preset = {
  id: string;
  rotulo: string;
  emoji: string;
  /** frase usada no lugar de "sem fumar" */
  sufixo: string;
  /** nome da unidade evitada, ex.: "cigarros" */
  unidade: string;
  /** sugestão de unidades/dia no cadastro */
  unidadesPorDiaPadrao?: number;
  /** sugestão de gasto diário no cadastro (R$) */
  gastoDiarioPadrao?: number;
  /** minutos de vida recuperados por unidade evitada (0 = não exibir) */
  minutosDeVidaPorUnidade?: number;
  /** contexto curto que vai no prompt do chat; sem prazos de recuperação */
  contexto: string;
  marcos: MarcoDef[];
};

/** Marcos genéricos de tempo — servem de base para qualquer hábito. */
function base(sufixo: string): MarcoDef[] {
  return [
    { chave: "1h", ms: HORA, titulo: `1 hora ${sufixo}`, corpo: "A primeira hora é a mais barulhenta. Você atravessou. A vontade vem em ondas e costuma passar em poucos minutos — respire fundo e ocupe as mãos." },
    { chave: "3h", ms: 3 * HORA, titulo: `3 horas ${sufixo}`, corpo: "Três horas. Beba água, respire fundo, ocupe as mãos. Cada hora que passa é uma hora que você escolheu." },
    { chave: "6h", ms: 6 * HORA, titulo: `6 horas ${sufixo}`, corpo: "Meio dia de vitória. Se bater irritação ou inquietação, é comum — não significa que algo está errado. Segure mais um pouco." },
    { chave: "12h", ms: 12 * HORA, titulo: `12 horas ${sufixo}`, corpo: "12 horas. Você já provou pra si mesmo que consegue. Amanhã cedo pode vir um pedido forte — é só um pedido, não uma ordem." },
    { chave: "1d", ms: DIA, titulo: `24 horas ${sufixo}`, corpo: "Um dia inteiro. Isso não é sorte, é decisão repetida: você tomou essa decisão várias vezes hoje." },
    { chave: "2d", ms: 2 * DIA, titulo: `2 dias ${sufixo}`, corpo: "48 horas. Os primeiros dias costumam ser os mais difíceis para muita gente. Se passar hoje, você passa por mais um." },
    { chave: "3d", ms: 3 * DIA, titulo: `3 dias ${sufixo}`, corpo: "Três dias. Daqui pra frente vale prestar atenção nos gatilhos: o horário, o lugar, a companhia. Conhecer o gatilho tira o poder dele." },
    { chave: "5d", ms: 5 * DIA, titulo: `5 dias ${sufixo}`, corpo: "Cinco dias. Continue — e repare no que ficou mais fácil desde o primeiro dia." },
    { chave: "7d", ms: SEMANA, titulo: `1 semana ${sufixo}`, corpo: "Uma semana inteira. Sete dias de escolhas. Isso já é uma história diferente da de sete dias atrás." },
    { chave: "14d", ms: 2 * SEMANA, titulo: `2 semanas ${sufixo}`, corpo: "Duas semanas. É comum aparecer o pensamento \"só dessa vez\". Vale lembrar do que você escolheu e por quê." },
    { chave: "21d", ms: 21 * DIA, titulo: `21 dias ${sufixo}`, corpo: "21 dias — três semanas de decisões. Não existe um número mágico para algo virar automático: varia muito de pessoa pra pessoa. Mas você já construiu rotina." },
    { chave: "30d", ms: MES, titulo: `1 mês ${sufixo}`, corpo: "Um mês. Olhe pra trás e conte quantas vezes você pensou em desistir e não desistiu. Esse é o seu histórico agora." },
    { chave: "60d", ms: 2 * MES, titulo: `2 meses ${sufixo}`, corpo: "Dois meses. Já não é \"estou tentando\": é o que você tem feito, dia após dia." },
    { chave: "90d", ms: 3 * MES, titulo: `3 meses ${sufixo}`, corpo: "90 dias. Três meses de constância. Se algum dia for difícil, lembre do caminho que já foi percorrido." },
    { chave: "180d", ms: 6 * MES, titulo: `6 meses ${sufixo}`, corpo: "Meio ano. Metade de um ano da sua vida vivida de um jeito diferente." },
    { chave: "270d", ms: 9 * MES, titulo: `9 meses ${sufixo}`, corpo: "Nove meses. Um tempo longo — e você continuou." },
    { chave: "1a", ms: ANO, titulo: `1 ANO ${sufixo}`, corpo: "Um ano completo. 365 dias de escolhas. Guarde essa data: ela é sua." },
    { chave: "18m", ms: 18 * MES, titulo: `1 ano e meio ${sufixo}`, corpo: "18 meses. Você já passou por aniversários, feriados e dias ruins — e continuou." },
    { chave: "2a", ms: 2 * ANO, titulo: `2 ANOS ${sufixo}`, corpo: "Dois anos. Isso já faz parte de quem você é." },
    { chave: "3a", ms: 3 * ANO, titulo: `3 ANOS ${sufixo}`, corpo: "Três anos de constância." },
    { chave: "5a", ms: 5 * ANO, titulo: `5 ANOS ${sufixo}`, corpo: "Cinco anos. Um capítulo inteiro da sua vida. Agradeça à pessoa que você era lá atrás por não ter desistido." },
    { chave: "10a", ms: 10 * ANO, titulo: `10 ANOS ${sufixo}`, corpo: "Uma década. Dez anos de uma decisão sustentada." },
  ];
}

/** Junta marcos genéricos com os específicos do preset (específico ganha). */
function montar(sufixo: string, especificos: MarcoDef[]): MarcoDef[] {
  const mapa = new Map<string, MarcoDef>();
  for (const m of base(sufixo)) mapa.set(m.chave, m);
  for (const m of especificos) mapa.set(m.chave, m);
  return [...mapa.values()].sort((a, b) => a.ms - b.ms);
}

/**
 * Cigarro: as afirmações de saúde vêm de CDC ("Benefits of Quitting", página de
 * 15/05/2024) e NHS ("Benefits of quitting smoking") e estão em beneficios.ts.
 * Onde o `corpo` as repete, diz "segundo" a fonte. Nada de prazo individual.
 */
const CIGARRO: MarcoDef[] = [
  { chave: "20min", ms: 20 * MIN, titulo: "20 minutos sem fumar", corpo: "Vinte minutos. A frequência cardíaca começa a cair em poucos minutos sem fumar, segundo o CDC. Seu corpo já está reagindo." },
  { chave: "1h", ms: HORA, titulo: "1 hora sem fumar", corpo: "Uma hora. A vontade vem em ondas e costuma passar em poucos minutos — ela passa, você fica." },
  { chave: "2h", ms: 2 * HORA, titulo: "2 horas sem fumar", corpo: "Duas horas. É por volta daqui que a vontade costuma aparecer: o corpo está acostumado a receber nicotina com frequência. É o hábito cobrando, não fraqueza sua." },
  { chave: "3h", ms: 3 * HORA, titulo: "3 horas sem fumar", corpo: "Três horas. Beba água, respire fundo e mude de ambiente por alguns minutos." },
  { chave: "6h", ms: 6 * HORA, titulo: "6 HORAS SEM FUMAR", corpo: "Seu corpo já está eliminando a nicotina. Quando você acordar amanhã, é comum vir um pedido forte — segure firme: passa em minutos e você volta a mandar." },
  { chave: "8h", ms: 8 * HORA, titulo: "8 horas sem fumar", corpo: "Oito horas — um turno inteiro. Enfrente um gatilho de cada vez: o café, a pausa, o telefone." },
  { chave: "12h", ms: 12 * HORA, titulo: "12 horas sem fumar", corpo: "Meio dia sem fumar. O pior momento de cada dia costuma ser o do hábito (o café, a pausa) — e você já enfrentou vários." },
  { chave: "1d", ms: DIA, titulo: "24 HORAS SEM FUMAR", corpo: "Um dia inteiro. Segundo o CDC, o nível de nicotina no sangue cai a zero em cerca de 24 horas. Você não teve sorte: decidiu isso várias vezes hoje e manteve." },
  { chave: "2d", ms: 2 * DIA, titulo: "48 horas sem fumar", corpo: "Dois dias. Nos primeiros dias ou semanas, paladar e olfato podem melhorar, segundo o NHS. Coma algo de que você gosta e repare." },
  { chave: "3d", ms: 3 * DIA, titulo: "72 HORAS SEM FUMAR", corpo: "Três dias. Em alguns dias, o monóxido de carbono no sangue cai ao nível de quem não fuma, segundo o CDC. Daqui pra frente o foco é o hábito: o gatilho, o horário, a companhia." },
  { chave: "5d", ms: 5 * DIA, titulo: "5 dias sem fumar", corpo: "Cinco dias. Siga atento aos gatilhos: café, pausa, telefone, estresse. Respire fundo agora e sinta." },
  { chave: "7d", ms: SEMANA, titulo: "1 SEMANA SEM FUMAR", corpo: "Sete dias. Uma semana de decisões. O que ficou mais fácil desde o primeiro dia?" },
  { chave: "10d", ms: 10 * DIA, titulo: "10 dias sem fumar", corpo: "Dez dias. Os gatilhos continuam, mas você já sabe o que fazer com eles." },
  { chave: "14d", ms: 2 * SEMANA, titulo: "2 semanas sem fumar", corpo: "Duas semanas. Cuidado com o pensamento \"só um não faz mal\": para quem está parando, ele costuma ser o caminho de volta." },
  { chave: "21d", ms: 21 * DIA, titulo: "21 dias sem fumar", corpo: "21 dias — três semanas. Não existe número mágico para um comportamento virar automático, mas cada dia ajuda." },
  { chave: "30d", ms: MES, titulo: "1 MÊS SEM FUMAR", corpo: "Um mês. Entre 1 e 12 meses sem fumar, tosse e falta de ar tendem a diminuir, segundo o CDC. Se a tosse persistir, vale conversar com um profissional de saúde." },
  { chave: "60d", ms: 2 * MES, titulo: "2 meses sem fumar", corpo: "Dois meses. O NHS aponta que benefícios para a saúde mental podem aparecer a partir de cerca de 6 semanas. Repare como você tem se sentido." },
  { chave: "90d", ms: 3 * MES, titulo: "3 MESES SEM FUMAR", corpo: "Três meses de constância. Olhe quanto já foi poupado e quanto caminho já foi percorrido." },
  { chave: "180d", ms: 6 * MES, titulo: "6 meses sem fumar", corpo: "Meio ano sem fumar. Metade de um ano vivida de um jeito diferente." },
  { chave: "270d", ms: 9 * MES, titulo: "9 meses sem fumar", corpo: "Nove meses sem fumar. Siga assim." },
  { chave: "1a", ms: ANO, titulo: "1 ANO SEM FUMAR", corpo: "Um ano. Entre 1 e 2 anos sem fumar, o risco de infarto cai de forma acentuada em comparação com continuar fumando, segundo o CDC. Guarde essa data." },
  { chave: "18m", ms: 18 * MES, titulo: "1 ano e meio sem fumar", corpo: "18 meses. Você já atravessou aniversários, festas, viagens e dias difíceis — e continuou." },
  { chave: "2a", ms: 2 * ANO, titulo: "2 ANOS sem fumar", corpo: "Dois anos. Isso já não é tentativa: é rotina." },
  { chave: "5a", ms: 5 * ANO, titulo: "5 ANOS SEM FUMAR", corpo: "Cinco anos. Entre 5 e 10 anos sem fumar, o risco de AVC diminui, segundo o CDC. Cinco anos atrás você tomou uma decisão que segue valendo." },
  { chave: "10a", ms: 10 * ANO, titulo: "10 ANOS SEM FUMAR", corpo: "Uma década. Após 10 a 15 anos sem fumar, o risco adicional de câncer de pulmão cai pela metade, segundo o CDC." },
  { chave: "15a", ms: 15 * ANO, titulo: "15 ANOS SEM FUMAR", corpo: "Quinze anos. O risco de doença coronariana fica próximo ao de quem nunca fumou, segundo o CDC e o NHS." },
];

/** Álcool: sem afirmação de benefício. Mantém só o aviso de segurança. */
const ALCOOL: MarcoDef[] = [
  { chave: "6h", ms: 6 * HORA, titulo: "6 horas sem beber", corpo: "Seis horas. Segundo o MedlinePlus, a abstinência de álcool costuma começar em até 8 horas depois da última dose: ansiedade, tremor, suor, dor de cabeça e insônia estão entre os sintomas. Se você bebia muito e todo dia, não pare sem orientação médica. Convulsão, febre ou confusão: SAMU 192." },
  { chave: "12h", ms: 12 * HORA, titulo: "12 horas sem beber", corpo: "Doze horas. Ansiedade, irritação e tremor leve podem aparecer em quem bebia com frequência. Se for intenso, vier com confusão, febre, alucinação ou convulsão, procure atendimento agora (SAMU 192)." },
  { chave: "1d", ms: DIA, titulo: "24 HORAS SEM BEBER", corpo: "Um dia inteiro. Segundo o MedlinePlus, os sintomas de abstinência costumam atingir o pico entre 24 e 72 horas. Se pesar, peça ajuda; se vier com confusão, febre ou convulsão, SAMU 192." },
  { chave: "3d", ms: 3 * DIA, titulo: "72 horas sem beber", corpo: "Três dias. Segundo o MedlinePlus, depois do pico de 24 a 72 horas os sintomas podem continuar por semanas, mais leves para muita gente. Repare nos gatilhos: o horário, o lugar, a companhia." },
  { chave: "7d", ms: SEMANA, titulo: "1 SEMANA SEM BEBER", corpo: "Uma semana. Segundo o NHS, entre os efeitos imediatos de reduzir o álcool estão acordar melhor, menos cansaço durante o dia e mais energia. O que você notou?" },
  { chave: "14d", ms: 2 * SEMANA, titulo: "2 semanas sem beber", corpo: "Duas semanas. Continue — e repare em como você tem passado os momentos que antes eram de bebida." },
  { chave: "30d", ms: MES, titulo: "1 MÊS SEM BEBER", corpo: "Um mês. Segundo o NHS, reduzir o álcool pode melhorar o humor e ajudar a acordar mais descansado. Olhe pra trás: quantas situações você atravessou sem beber?" },
  { chave: "90d", ms: 3 * MES, titulo: "3 meses sem beber", corpo: "Três meses de constância. Segundo o MedlinePlus, alterações de sono, de humor e cansaço podem durar meses depois de parar; não quer dizer que algo deu errado." },
  { chave: "180d", ms: 6 * MES, titulo: "6 meses sem beber", corpo: "Meio ano. Metade de um ano vivida de outro jeito." },
  { chave: "1a", ms: ANO, titulo: "1 ANO SEM BEBER", corpo: "Um ano inteiro. 365 dias de escolhas." },
];

const VAPE: MarcoDef[] = [
  { chave: "1h", ms: HORA, titulo: "1 hora sem vape", corpo: "A primeira hora sem tragar. O reflexo de levar a mão ao bolso vai aparecer — é só um reflexo. Ocupe as mãos." },
  { chave: "6h", ms: 6 * HORA, titulo: "6 horas sem vape", corpo: "Seis horas. Segundo o NHS, a abstinência de nicotina pode começar poucas horas depois do último uso: vontade forte, inquietação, irritação. O vape também tem nicotina. É desconfortável e passa." },
  { chave: "12h", ms: 12 * HORA, titulo: "12 horas sem vape", corpo: "Doze horas. Troque o gesto: água, chiclete, uma caneta na mão." },
  { chave: "1d", ms: DIA, titulo: "24 HORAS SEM VAPE", corpo: "Um dia sem vape. Você decidiu isso várias vezes hoje e manteve." },
  { chave: "3d", ms: 3 * DIA, titulo: "72 HORAS SEM VAPE", corpo: "Três dias. Segundo o NHS, a abstinência de nicotina costuma ser mais forte na primeira semana, principalmente nos 3 primeiros dias: você está atravessando a parte mais difícil." },
  { chave: "7d", ms: SEMANA, titulo: "1 semana sem vape", corpo: "Uma semana. Segundo o CDC, os sintomas de quem para de vapear são temporários e diminuem com o tempo sem nicotina. Note quantas vezes a mão foi ao bolso e voltou." },
  { chave: "30d", ms: MES, titulo: "1 MÊS SEM VAPE", corpo: "Um mês inteiro. Segundo o NHS, em média os sintomas de abstinência de nicotina duram de 3 a 4 semanas; para algumas pessoas, mais. Você quebrou o ritmo do hábito." },
];

const ACUCAR: MarcoDef[] = [
  { chave: "12h", ms: 12 * HORA, titulo: "12 horas sem açúcar", corpo: "Doze horas. A vontade de doce costuma ser mais hábito do que fome: repare em que momento ela aparece." },
  { chave: "1d", ms: DIA, titulo: "24 horas sem açúcar", corpo: "Um dia. Planejar o lanche da tarde ajuda a atravessar o horário mais difícil." },
  { chave: "3d", ms: 3 * DIA, titulo: "72 horas sem açúcar", corpo: "Três dias. A vontade vai e vem; costuma passar se você esperar alguns minutos. Beba água e mude de ambiente." },
  { chave: "7d", ms: SEMANA, titulo: "1 semana sem açúcar", corpo: "Uma semana. Repare se o seu paladar está diferente e se os horários de vontade mudaram." },
  { chave: "14d", ms: 2 * SEMANA, titulo: "2 semanas sem açúcar", corpo: "Duas semanas. Continue anotando como você se sente ao longo do dia." },
  { chave: "30d", ms: MES, titulo: "1 mês sem açúcar", corpo: "Um mês. Olhe pra trás: quantas vezes você escolheu outra coisa?" },
  { chave: "90d", ms: 3 * MES, titulo: "3 meses sem açúcar", corpo: "Três meses de constância. Isso já é um jeito novo de comer." },
];

const PORNOGRAFIA: MarcoDef[] = [
  { chave: "1d", ms: DIA, titulo: "24 horas", corpo: "Um dia. O impulso costuma vir junto com tédio, estresse ou solidão — não só com desejo. Reconhecer isso já ajuda." },
  { chave: "3d", ms: 3 * DIA, titulo: "72 horas", corpo: "Três dias. Se a vontade apertar, saia do lugar, mude de ambiente, fale com alguém. Evite decidir deitado, sozinho, com o celular." },
  { chave: "7d", ms: SEMANA, titulo: "1 semana", corpo: "Uma semana. Repare em como você tem usado o tempo que antes ia para isso." },
  { chave: "14d", ms: 2 * SEMANA, titulo: "2 semanas", corpo: "Duas semanas. Continue — e repare em como você tem se sentido nas interações do dia a dia." },
  { chave: "30d", ms: MES, titulo: "1 mês", corpo: "Um mês. Olhe pra trás: quantas vezes o impulso veio e você escolheu outra coisa?" },
  { chave: "90d", ms: 3 * MES, titulo: "90 DIAS", corpo: "Três meses de constância. Se algum dia for difícil, lembre do caminho percorrido e converse com alguém de confiança ou com um profissional." },
  { chave: "180d", ms: 6 * MES, titulo: "6 meses", corpo: "Meio ano. Metade de um ano vivida de outro jeito." },
];

const REDES: MarcoDef[] = [
  { chave: "6h", ms: 6 * HORA, titulo: "6 horas fora das redes", corpo: "Seis horas. A vontade de desbloquear o celular sem motivo costuma ser um reflexo; ela enfraquece com a repetição." },
  { chave: "1d", ms: DIA, titulo: "24 horas fora das redes", corpo: "Um dia. Repare no que você fez com o tempo que costumava ir para o celular." },
  { chave: "3d", ms: 3 * DIA, titulo: "3 dias fora das redes", corpo: "Três dias. Note quantas vezes hoje você pegou o celular e largou." },
  { chave: "7d", ms: SEMANA, titulo: "1 semana fora das redes", corpo: "Uma semana. Quantas horas você ganhou de volta? Vale somar." },
  { chave: "30d", ms: MES, titulo: "1 mês fora das redes", corpo: "Um mês inteiro em que a sua vida aconteceu em primeira pessoa." },
  { chave: "90d", ms: 3 * MES, titulo: "3 meses fora das redes", corpo: "90 dias. A sua atenção, no seu comando." },
];

const APOSTAS: MarcoDef[] = [
  { chave: "1d", ms: DIA, titulo: "24 horas sem apostar", corpo: "Um dia sem apostar. Em jogos de azar, a vantagem matemática é da casa: cada hora sem entrar no app é dinheiro que continua sendo seu." },
  { chave: "3d", ms: 3 * DIA, titulo: "3 dias sem apostar", corpo: "Três dias. O impulso de recuperar o prejuízo é a armadilha central. Você não recupera apostando: recupera parando." },
  { chave: "7d", ms: SEMANA, titulo: "1 SEMANA SEM APOSTAR", corpo: "Uma semana. Some o que você teria apostado nesses 7 dias. Esse valor ficou com você." },
  { chave: "30d", ms: MES, titulo: "1 mês sem apostar", corpo: "Um mês. O seu dinheiro e a sua atenção continuaram com você. Se ainda tem dívida, agora ela só diminui." },
  { chave: "90d", ms: 3 * MES, titulo: "3 meses sem apostar", corpo: "90 dias. Manter a autoexclusão ativa nas plataformas e ter apoio por perto protege o que você construiu." },
];

const CAFEINA: MarcoDef[] = [
  { chave: "12h", ms: 12 * HORA, titulo: "12 horas sem cafeína", corpo: "Doze horas. Segundo o MedlinePlus, parar de repente pode causar dor de cabeça, sonolência, irritação, náusea e dificuldade de concentração. Hidrate-se bem." },
  { chave: "1d", ms: DIA, titulo: "24 horas sem cafeína", corpo: "Um dia. Beba água ao longo do dia e durma um pouco mais cedo, se puder." },
  { chave: "2d", ms: 2 * DIA, titulo: "48 horas sem cafeína", corpo: "Dois dias. Segundo o MedlinePlus, os sintomas de abstinência de cafeína costumam passar em alguns dias. Siga firme." },
  { chave: "7d", ms: SEMANA, titulo: "1 semana sem cafeína", corpo: "Uma semana. Repare no seu sono e no seu nível de energia ao longo do dia." },
  { chave: "30d", ms: MES, titulo: "1 mês sem cafeína", corpo: "Um mês. Se um dia voltar a tomar, que seja uma escolha e não um automático." },
];

/**
 * Roer unhas. Os textos dos marcos de 1 a 30 dias vêm do tema do catálogo (uma só fonte de verdade,
 * com as fontes e os limites dele): o app não promete recuperação nem prazo. O cronômetro aqui mede o
 * tempo desde o último episódio INFORMADO; "Registrar recaída" é "roí". Os marcos além de 30 dias são
 * só factuais e perguntam o que a pessoa percebeu.
 */
const UNHAS: MarcoDef[] = [
  ...temaUnhas.marcos.map((m) => ({ chave: `${m.limiar}d`, ms: m.limiar * DIA, titulo: m.titulo, corpo: m.texto })),
  { chave: "60d", ms: 2 * MES, titulo: "2 meses sem roer, conforme seus registros", corpo: "Dois meses sem episódio informado. Na média de um estudo com adultos jovens saudáveis, a unha da mão cresce cerca de 3,5 mm por mês: em dois meses, perto de 7 mm. O ritmo é seu; o que você percebe?" },
  { chave: "90d", ms: 3 * MES, titulo: "3 meses sem roer, conforme seus registros", corpo: "Três meses sem episódio informado. Em estudos pequenos, quem aprendeu a perceber a mão indo à boca e trocar por outro gesto manteve unhas maiores meses depois. Se a vontade voltar, ela não apaga esse caminho." },
  { chave: "180d", ms: 6 * MES, titulo: "6 meses sem roer, conforme seus registros", corpo: "Meio ano sem episódio informado. Para algumas pessoas, o aspecto das unhas pesava na autoestima; repare no que mudou para você. Guarde o que ajudou para os dias de tensão." },
  { chave: "1a", ms: ANO, titulo: "1 ANO sem roer, conforme seus registros", corpo: "Um ano sem episódio informado. Guarde essa data: ela é sua." },
];

export const PRESETS: Preset[] = [
  {
    id: "cigarro",
    rotulo: "Parar de fumar",
    emoji: "🚭",
    sufixo: "sem fumar",
    unidade: "cigarros",
    unidadesPorDiaPadrao: 20,
    gastoDiarioPadrao: 12,
    minutosDeVidaPorUnidade: 11,
    contexto:
      "Dependência de nicotina. A vontade vem em ondas curtas, que costumam passar em poucos minutos, e tende a diminuir de frequência com o tempo. Gatilhos clássicos: café, álcool, pós-refeição, telefone, direção, estresse, ver alguém fumando, primeira hora do dia. Não cite prazos de recuperação como regra: o ritmo varia de pessoa para pessoa.",
    marcos: montar("sem fumar", CIGARRO),
  },
  {
    id: "vape",
    rotulo: "Parar de vapear",
    emoji: "💨",
    sufixo: "sem vape",
    unidade: "pods",
    unidadesPorDiaPadrao: 0.5,
    gastoDiarioPadrao: 10,
    contexto:
      "Dependência de nicotina por vape/pod. Costuma gerar uso contínuo ao longo do dia e um hábito motor muito frequente (levar a mão à boca). Não cite prazos de recuperação como regra.",
    marcos: montar("sem vape", VAPE),
  },
  {
    id: "alcool",
    rotulo: "Parar de beber",
    emoji: "🍺",
    sufixo: "sem beber",
    unidade: "doses",
    unidadesPorDiaPadrao: 3,
    gastoDiarioPadrao: 25,
    contexto:
      "Redução/cessação de álcool. ATENÇÃO: em dependência física a abstinência pode ser perigosa (tremor intenso, confusão, convulsão) e exige acompanhamento médico. Gatilhos clássicos: sexta-feira, futebol, churrasco, briga, fim de expediente.",
    marcos: montar("sem beber", ALCOOL),
  },
  {
    id: "acucar",
    rotulo: "Cortar açúcar",
    emoji: "🍬",
    sufixo: "sem açúcar",
    unidade: "doces",
    unidadesPorDiaPadrao: 2,
    gastoDiarioPadrao: 8,
    contexto:
      "Corte de açúcar adicionado/ultraprocessado. A vontade costuma ir e vir e passar em alguns minutos. Gatilhos: fim de refeição, cansaço à tarde, estresse, noite. Não cite prazos de recuperação ou efeitos metabólicos como regra.",
    marcos: montar("sem açúcar", ACUCAR),
  },
  {
    id: "pornografia",
    rotulo: "Parar com pornografia",
    emoji: "🧠",
    sufixo: "limpo",
    unidade: "episódios",
    contexto:
      "Uso compulsivo de pornografia. O impulso costuma ser ligado a tédio, estresse, solidão e a estar sozinho com o celular à noite. A estratégia central é mudar de ambiente e de estado físico quando o impulso chega. Não faça afirmações neurológicas nem cite prazos de recuperação.",
    marcos: montar("limpo", PORNOGRAFIA),
  },
  {
    id: "redes",
    rotulo: "Menos redes sociais",
    emoji: "📵",
    sufixo: "fora das redes",
    unidade: "sessões",
    contexto:
      "Uso compulsivo de redes sociais/celular. O impulso de checar aparece muitas vezes sem motivo consciente. Ajuda ter fricção (apps fora da tela inicial, sem notificação) e substituir a ação.",
    marcos: montar("fora das redes", REDES),
  },
  {
    id: "apostas",
    rotulo: "Parar de apostar",
    emoji: "🎰",
    sufixo: "sem apostar",
    unidade: "apostas",
    gastoDiarioPadrao: 30,
    contexto:
      "Jogo/aposta compulsiva. O pensamento mais perigoso é \"vou recuperar o que perdi\". Autoexclusão nas plataformas, bloqueio de pagamento e apoio externo ajudam. No Brasil há apoio gratuito em grupos de Jogadores Anônimos e no CVV (188).",
    marcos: montar("sem apostar", APOSTAS),
  },
  {
    id: "cafeina",
    rotulo: "Cortar cafeína",
    emoji: "☕",
    sufixo: "sem cafeína",
    unidade: "cafés",
    unidadesPorDiaPadrao: 4,
    gastoDiarioPadrao: 12,
    contexto:
      "Corte de cafeína. Pode causar dor de cabeça, sonolência e irritabilidade nos primeiros dias; reduzir aos poucos costuma diminuir o desconforto. Não cite prazos exatos como regra.",
    marcos: montar("sem cafeína", CAFEINA),
  },
  {
    id: "unhas",
    rotulo: "Parar de roer unhas",
    emoji: "💅",
    sufixo: "sem roer",
    unidade: "episódios",
    contexto:
      "Hábito de roer ou morder as unhas (onicofagia), geralmente automático e ligado a tédio, estresse ou tensão. Não prometa recuperação das unhas nem dê prazo: nenhuma fonte consultada o traz. Não diagnostique ansiedade. Ajuda ocupar as mãos e reconhecer os gatilhos.",
    marcos: UNHAS,
  },
  {
    id: "personalizado",
    rotulo: "Outro hábito",
    emoji: "🔥",
    sufixo: "firme",
    unidade: "vezes",
    contexto:
      "Hábito personalizado definido pela própria pessoa. Use o título e o porquê que ela escreveu para entender do que se trata.",
    marcos: montar("firme", []),
  },
];

/** Tema do catálogo (conteúdo com fontes) que acompanha cada tipo de marco. */
export const TEMA_DO_PRESET: Record<string, string> = {
  cigarro: "parar-de-fumar",
  cafeina: "cafeina",
  unhas: "unhas",
};

export function preset(id: string): Preset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[PRESETS.length - 1];
}

/** Marcos atingidos e o próximo, dado o tempo decorrido em ms. */
export function situacao(presetId: string, decorridoMs: number) {
  const p = preset(presetId);
  const atingidos = p.marcos.filter((m) => m.ms <= decorridoMs);
  const futuros = p.marcos.filter((m) => m.ms > decorridoMs);
  const proximo = futuros[0] ?? null;
  const anterior = atingidos[atingidos.length - 1] ?? null;
  const inicio = anterior?.ms ?? 0;
  const progresso = proximo
    ? Math.max(0, Math.min(1, (decorridoMs - inicio) / (proximo.ms - inicio)))
    : 1;
  return { preset: p, atingidos, futuros, proximo, anterior, progresso };
}
