/**
 * Catálogo de hábitos e a linha do tempo de marcos de cada um.
 *
 * Cada marco vira: um item na timeline dentro do app + uma notificação push
 * disparada no instante exato em que a pessoa o atinge.
 */

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
  /** corpo da notificação — o que o corpo/cabeça está fazendo agora */
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
  /** contexto clínico curto que vai no prompt do chat */
  contexto: string;
  marcos: MarcoDef[];
};

/** Marcos genéricos de tempo — servem de base para qualquer hábito. */
function base(sufixo: string): MarcoDef[] {
  return [
    { chave: "1h", ms: HORA, titulo: `1 hora ${sufixo}`, corpo: "A primeira hora é a mais barulhenta. Você atravessou. A vontade vem em ondas de 3 a 5 minutos — ela sempre passa, você é que fica." },
    { chave: "3h", ms: 3 * HORA, titulo: `3 horas ${sufixo}`, corpo: "Três horas. Seu cérebro está começando a entender que a regra mudou. Beba água, respire fundo, ocupe as mãos." },
    { chave: "6h", ms: 6 * HORA, titulo: `6 horas ${sufixo}`, corpo: "Meio dia de vitória. A irritação que você talvez sinta agora é abstinência, não personalidade. Ela é temporária." },
    { chave: "12h", ms: 12 * HORA, titulo: `12 horas ${sufixo}`, corpo: "12 horas limpas. Você já provou pra si mesmo que consegue. Amanhã de manhã seu corpo vai pedir — segure firme, é só um pedido, não uma ordem." },
    { chave: "1d", ms: DIA, titulo: `24 horas ${sufixo}`, corpo: "Um dia inteiro. Isso não é sorte, é decisão repetida. Você tomou essa decisão dezenas de vezes hoje e ganhou todas." },
    { chave: "2d", ms: 2 * DIA, titulo: `2 dias ${sufixo}`, corpo: "48 horas. O pior costuma ser entre o segundo e o terceiro dia. Se passar hoje, você passa por qualquer coisa." },
    { chave: "3d", ms: 3 * DIA, titulo: `3 dias ${sufixo}`, corpo: "72 horas. O pico da abstinência física fica para trás a partir de agora. Daqui pra frente é mais cabeça do que corpo." },
    { chave: "5d", ms: 5 * DIA, titulo: `5 dias ${sufixo}`, corpo: "Cinco dias. Seu sono e seu humor começam a se reorganizar. Continue." },
    { chave: "7d", ms: SEMANA, titulo: `1 semana ${sufixo}`, corpo: "Uma semana inteira. Você já não é a mesma pessoa de sete dias atrás. Isso já é uma história diferente." },
    { chave: "14d", ms: 2 * SEMANA, titulo: `2 semanas ${sufixo}`, corpo: "Duas semanas. Aqui costuma aparecer o pensamento perigoso: só uma não faz mal. Faz. Ele te leva de volta ao dia zero." },
    { chave: "21d", ms: 21 * DIA, titulo: `21 dias ${sufixo}`, corpo: "21 dias. É o tempo em que um comportamento começa a virar automático. O esforço diminui a partir daqui." },
    { chave: "30d", ms: MES, titulo: `1 mês ${sufixo}`, corpo: "Um mês. Olhe pra trás e conte quantas vezes você quase desistiu e não desistiu. Esse é o seu currículo agora." },
    { chave: "60d", ms: 2 * MES, titulo: `2 meses ${sufixo}`, corpo: "Dois meses. Já não é mais estou tentando parar. Você parou." },
    { chave: "90d", ms: 3 * MES, titulo: `3 meses ${sufixo}`, corpo: "90 dias. É o marco clássico de reorganização do sistema de recompensa. As coisas simples voltam a dar prazer." },
    { chave: "180d", ms: 6 * MES, titulo: `6 meses ${sufixo}`, corpo: "Meio ano. Metade de um ano da sua vida vivida de um jeito diferente. Isso muda quem você é, não só o que você faz." },
    { chave: "270d", ms: 9 * MES, titulo: `9 meses ${sufixo}`, corpo: "Nove meses. Tempo suficiente para gerar uma vida inteira — e você usou para reconstruir a sua." },
    { chave: "1a", ms: ANO, titulo: `1 ANO ${sufixo}`, corpo: "Um ano completo. 365 dias de escolhas. Guarde essa data: hoje é o seu aniversário de liberdade." },
    { chave: "18m", ms: 18 * MES, titulo: `1 ano e meio ${sufixo}`, corpo: "18 meses. Você já passou por todas as estações, todos os feriados, todas as desculpas — e continuou." },
    { chave: "2a", ms: 2 * ANO, titulo: `2 ANOS ${sufixo}`, corpo: "Dois anos. Isso já não é força de vontade, é identidade." },
    { chave: "3a", ms: 3 * ANO, titulo: `3 ANOS ${sufixo}`, corpo: "Três anos. Poucas pessoas mantêm qualquer coisa por três anos. Você mantém." },
    { chave: "5a", ms: 5 * ANO, titulo: `5 ANOS ${sufixo}`, corpo: "Cinco anos. Um capítulo inteiro da sua vida. Agradeça à pessoa que você era lá atrás por não ter desistido." },
    { chave: "10a", ms: 10 * ANO, titulo: `10 ANOS ${sufixo}`, corpo: "Uma década. Você virou a prova viva de que dá." },
  ];
}

/** Junta marcos genéricos com os específicos do preset (específico ganha). */
function montar(sufixo: string, especificos: MarcoDef[]): MarcoDef[] {
  const mapa = new Map<string, MarcoDef>();
  for (const m of base(sufixo)) mapa.set(m.chave, m);
  for (const m of especificos) mapa.set(m.chave, m);
  return [...mapa.values()].sort((a, b) => a.ms - b.ms);
}

const CIGARRO: MarcoDef[] = [
  { chave: "20min", ms: 20 * MIN, titulo: "20 minutos sem fumar", corpo: "Sua frequência cardíaca e sua pressão arterial já caíram para níveis normais. Vinte minutos e seu corpo já respondeu." },
  { chave: "1h", ms: HORA, titulo: "1 hora sem fumar", corpo: "Uma hora. A circulação nas mãos e nos pés já começou a melhorar. A vontade vem em ondas de 3 a 5 minutos — ela passa, você fica." },
  { chave: "2h", ms: 2 * HORA, titulo: "2 horas sem fumar", corpo: "Duas horas. A nicotina no seu sangue já caiu pela metade. É por isso que a fissura aparece agora — é o corpo cobrando, não você fraquejando." },
  { chave: "3h", ms: 3 * HORA, titulo: "3 horas sem fumar", corpo: "Três horas. Seus brônquios começam a relaxar e respirar fica mais fácil. Beba água: acelera a eliminação da nicotina." },
  { chave: "6h", ms: 6 * HORA, titulo: "6 HORAS SEM FUMAR", corpo: "Seu corpo já está se livrando da nicotina de verdade. Quando você acordar amanhã, ele vai pedir — é o pico matinal. Segure firme: passa em minutos e você volta a mandar." },
  { chave: "8h", ms: 8 * HORA, titulo: "8 horas sem fumar", corpo: "O monóxido de carbono no seu sangue caiu pela metade e o oxigênio subiu. Seu cérebro está sendo melhor irrigado agora do que ontem." },
  { chave: "12h", ms: 12 * HORA, titulo: "12 horas sem fumar", corpo: "O monóxido de carbono voltou ao nível normal. Seu sangue está limpo dele. Metade de um dia — e o mais difícil já ficou para trás." },
  { chave: "1d", ms: DIA, titulo: "24 HORAS SEM FUMAR", corpo: "Um dia inteiro. A partir de agora seu risco de infarto já começou a cair. Você não teve sorte: você decidiu isso umas cinquenta vezes hoje e ganhou todas." },
  { chave: "2d", ms: 2 * DIA, titulo: "48 horas sem fumar", corpo: "Suas terminações nervosas estão se regenerando. Paladar e olfato voltando. Coma alguma coisa que você ama — vai ter gosto diferente." },
  { chave: "3d", ms: 3 * DIA, titulo: "72 HORAS SEM FUMAR", corpo: "Nicotina ZERO no seu corpo. Acabou a parte química. Tudo daqui pra frente é hábito e cabeça — e essas duas coisas você controla." },
  { chave: "5d", ms: 5 * DIA, titulo: "5 dias sem fumar", corpo: "Cinco dias. A ansiedade dos primeiros dias já está cedendo e a capacidade pulmonar começa a subir. Respire fundo agora e sinta." },
  { chave: "7d", ms: SEMANA, titulo: "1 SEMANA SEM FUMAR", corpo: "Sete dias. Quem passa da primeira semana tem muito mais chance de nunca mais voltar. Você está do lado certo da estatística." },
  { chave: "10d", ms: 10 * DIA, titulo: "10 dias sem fumar", corpo: "Os episódios de fissura já estão mais curtos e mais raros. Seu cérebro está reaprendendo a funcionar sem nicotina." },
  { chave: "14d", ms: 2 * SEMANA, titulo: "2 semanas sem fumar", corpo: "Circulação nitidamente melhor e função pulmonar bem maior. Cuidado com o pensamento só um não faz mal — é o único caminho de volta ao dia zero." },
  { chave: "21d", ms: 21 * DIA, titulo: "21 dias sem fumar", corpo: "Os receptores de nicotina do seu cérebro estão voltando ao número normal. O desejo automático está literalmente desaparecendo do hardware." },
  { chave: "30d", ms: MES, titulo: "1 MÊS SEM FUMAR", corpo: "Um mês. Os cílios dos seus pulmões voltaram a crescer e já estão varrendo o alcatrão para fora. Tossir um pouco agora é limpeza, não doença." },
  { chave: "60d", ms: 2 * MES, titulo: "2 meses sem fumar", corpo: "Dois meses. Sua pele está mais oxigenada, sua respiração no esforço melhorou e o cheiro de cigarro já saiu de você." },
  { chave: "90d", ms: 3 * MES, titulo: "3 MESES SEM FUMAR", corpo: "Função pulmonar significativamente recuperada e circulação normalizada. Subir escada não é mais o mesmo evento que era três meses atrás." },
  { chave: "180d", ms: 6 * MES, titulo: "6 meses sem fumar", corpo: "Meio ano. A tosse crônica, o catarro e a falta de ar diminuíram muito. Seus pulmões estão fazendo o trabalho deles de novo." },
  { chave: "270d", ms: 9 * MES, titulo: "9 meses sem fumar", corpo: "Os cílios pulmonares estão praticamente recuperados. Infecção respiratória agora é bem menos provável do que era." },
  { chave: "1a", ms: ANO, titulo: "1 ANO SEM FUMAR", corpo: "Seu risco de doença coronariana caiu pela METADE em relação a quem continuou fumando. Um ano de decisões diárias comprou isso. Guarde essa data." },
  { chave: "18m", ms: 18 * MES, titulo: "1 ano e meio sem fumar", corpo: "18 meses. Você já atravessou todos os gatilhos do calendário: aniversários, brigas, festas, viagens, cerveja. E continuou." },
  { chave: "2a", ms: 2 * ANO, titulo: "2 ANOS sem fumar", corpo: "Dois anos. Seu risco de infarto se aproxima muito do de quem nunca fumou. Isso não é mais tentativa, é quem você é." },
  { chave: "5a", ms: 5 * ANO, titulo: "5 ANOS SEM FUMAR", corpo: "Seu risco de AVC caiu para perto do de um não fumante. Cinco anos atrás você tomou uma decisão que ainda está te protegendo hoje." },
  { chave: "10a", ms: 10 * ANO, titulo: "10 ANOS SEM FUMAR", corpo: "Seu risco de morrer de câncer de pulmão é cerca de METADE do de quem continuou fumando. Uma década de vida comprada de volta." },
  { chave: "15a", ms: 15 * ANO, titulo: "15 ANOS SEM FUMAR", corpo: "Seu risco cardiovascular é praticamente igual ao de alguém que nunca fumou na vida. Você desfez o que parecia irreversível." },
];

const ALCOOL: MarcoDef[] = [
  { chave: "6h", ms: 6 * HORA, titulo: "6 horas sem beber", corpo: "Sua glicemia está se estabilizando e o fígado já saiu do modo emergência. Beba água e coma alguma coisa." },
  { chave: "12h", ms: 12 * HORA, titulo: "12 horas sem beber", corpo: "Doze horas. Se aparecer ansiedade ou tremor, é abstinência — passa. Se for intenso ou vier com confusão mental, procure um médico." },
  { chave: "1d", ms: DIA, titulo: "24 HORAS SEM BEBER", corpo: "Seu corpo está oficialmente livre de álcool. A partir de agora tudo que acontece é reconstrução." },
  { chave: "3d", ms: 3 * DIA, titulo: "72 horas sem beber", corpo: "A parte mais dura da abstinência ficou para trás. Sua energia começa a voltar e a névoa mental a se dissipar." },
  { chave: "7d", ms: SEMANA, titulo: "1 SEMANA SEM BEBER", corpo: "Seu sono profundo voltou — é por isso que você está acordando diferente. Pele mais hidratada e pressão mais baixa." },
  { chave: "14d", ms: 2 * SEMANA, titulo: "2 semanas sem beber", corpo: "Duas semanas. A queima de gordura no fígado já começou e azia e refluxo tendem a sumir." },
  { chave: "30d", ms: MES, titulo: "1 MÊS SEM BEBER", corpo: "Um mês. Gordura no fígado bem menor, pressão arterial melhor e a qualidade do seu sono é outra." },
  { chave: "90d", ms: 3 * MES, titulo: "3 meses sem beber", corpo: "Memória, concentração e humor visivelmente melhores. Seu fígado se regenera rápido quando você deixa ele trabalhar." },
  { chave: "180d", ms: 6 * MES, titulo: "6 meses sem beber", corpo: "Meio ano. Risco cardiovascular e inflamação bem menores. Seu corpo agradece em silêncio todos os dias." },
  { chave: "1a", ms: ANO, titulo: "1 ANO SEM BEBER", corpo: "Um ano inteiro. Você provou que a sua vida social, seu luto, sua alegria e seu tédio nunca dependeram disso." },
];

const VAPE: MarcoDef[] = [
  { chave: "1h", ms: HORA, titulo: "1 hora sem vape", corpo: "A primeira hora sem tragar. O reflexo de levar a mão ao bolso vai aparecer — é só um reflexo. Ocupe as mãos." },
  { chave: "6h", ms: 6 * HORA, titulo: "6 horas sem vape", corpo: "Seis horas. Como o vape entrega nicotina o dia inteiro, seu corpo sente a falta de forma contínua. É desconfortável e é temporário." },
  { chave: "12h", ms: 12 * HORA, titulo: "12 horas sem vape", corpo: "Sua oxigenação melhorou e a irritação na garganta já começa a ceder." },
  { chave: "1d", ms: DIA, titulo: "24 HORAS SEM VAPE", corpo: "Um dia. Sua frequência cardíaca em repouso já caiu e a irritação das vias aéreas começa a diminuir." },
  { chave: "3d", ms: 3 * DIA, titulo: "72 HORAS SEM VAPE", corpo: "Nicotina zerada. Acabou a parte química — o resto é o hábito de levar a mão à boca, e esse você desmonta com repetição." },
  { chave: "7d", ms: SEMANA, titulo: "1 semana sem vape", corpo: "Uma semana. Tosse e falta de ar reduzindo, capacidade pulmonar subindo. Você não está mais inalando nada que não seja ar." },
  { chave: "30d", ms: MES, titulo: "1 MÊS SEM VAPE", corpo: "Um mês. Vias aéreas bem menos inflamadas, sono melhor, dependência química desfeita. Você quebrou o loop." },
];

const ACUCAR: MarcoDef[] = [
  { chave: "12h", ms: 12 * HORA, titulo: "12 horas sem açúcar", corpo: "Sua insulina está caindo e seu corpo começando a usar gordura como energia. A vontade de doce agora é hábito, não fome." },
  { chave: "1d", ms: DIA, titulo: "24 horas sem açúcar", corpo: "Um dia. Os picos e quedas de energia que te derrubavam à tarde vão começar a sumir." },
  { chave: "3d", ms: 3 * DIA, titulo: "72 horas sem açúcar", corpo: "O pico da fissura por doce é aqui. Se você passar de hoje, a partir de amanhã fica visivelmente mais fácil." },
  { chave: "7d", ms: SEMANA, titulo: "1 semana sem açúcar", corpo: "Seu paladar está recalibrando: fruta vai voltar a parecer doce de verdade. Menos inflamação, menos inchaço." },
  { chave: "14d", ms: 2 * SEMANA, titulo: "2 semanas sem açúcar", corpo: "Energia mais estável o dia inteiro, menos névoa mental, pele geralmente melhor." },
  { chave: "30d", ms: MES, titulo: "1 mês sem açúcar", corpo: "Um mês. Sensibilidade à insulina melhor, triglicérides caindo e o desejo compulsivo bem mais fraco." },
  { chave: "90d", ms: 3 * MES, titulo: "3 meses sem açúcar", corpo: "Marcadores metabólicos melhores e um paladar completamente reeducado. Doce industrializado agora enjoa." },
];

const PORNOGRAFIA: MarcoDef[] = [
  { chave: "1d", ms: DIA, titulo: "24 horas", corpo: "Um dia. O impulso vem junto com tédio, estresse e solidão — não com desejo. Reconhecer isso já é metade do trabalho." },
  { chave: "3d", ms: 3 * DIA, titulo: "72 horas", corpo: "Três dias. Aqui a fissura costuma ser mais forte. Saia do lugar, mude de ambiente, fale com alguém. Não decida nada deitado." },
  { chave: "7d", ms: SEMANA, titulo: "1 semana", corpo: "Uma semana. Foco e motivação começam a voltar conforme seu sistema de recompensa sai da superestimulação." },
  { chave: "14d", ms: 2 * SEMANA, titulo: "2 semanas", corpo: "Duas semanas. Menos névoa mental, mais presença nas interações reais. Continue." },
  { chave: "30d", ms: MES, titulo: "1 mês", corpo: "Um mês. Ansiedade menor, sono melhor e mais interesse em pessoas de verdade. Seu cérebro está recalibrando o que é recompensa." },
  { chave: "90d", ms: 3 * MES, titulo: "90 DIAS", corpo: "90 dias — o marco clássico de reset. As coisas simples voltam a ser suficientes. Você recuperou o controle." },
  { chave: "180d", ms: 6 * MES, titulo: "6 meses", corpo: "Meio ano. Isso já não é uma luta diária, é o seu normal." },
];

const REDES: MarcoDef[] = [
  { chave: "6h", ms: 6 * HORA, titulo: "6 horas fora das redes", corpo: "Seis horas. A vontade de desbloquear o celular sem motivo é o loop de dopamina te chamando. Ele enfraquece com repetição." },
  { chave: "1d", ms: DIA, titulo: "24 horas fora das redes", corpo: "Um dia. Sua capacidade de ficar entediado sem fugir está voltando — e é dela que sai criatividade." },
  { chave: "3d", ms: 3 * DIA, titulo: "3 dias fora das redes", corpo: "Três dias. O impulso de checar já está mais espaçado. Note quantas vezes hoje você pegou o celular e largou." },
  { chave: "7d", ms: SEMANA, titulo: "1 semana fora das redes", corpo: "Uma semana. Atenção mais longa, comparação social menor, ansiedade menor. Você ganhou horas de volta." },
  { chave: "30d", ms: MES, titulo: "1 mês fora das redes", corpo: "Um mês inteiro em que a sua vida aconteceu em primeira pessoa." },
  { chave: "90d", ms: 3 * MES, titulo: "3 meses fora das redes", corpo: "90 dias. Sua atenção voltou a ser sua. Isso é raro hoje em dia." },
];

const APOSTAS: MarcoDef[] = [
  { chave: "1d", ms: DIA, titulo: "24 horas sem apostar", corpo: "Um dia sem apostar. Cada hora sem entrar no app é dinheiro que continua sendo seu. A casa sempre ganha no longo prazo — sempre." },
  { chave: "3d", ms: 3 * DIA, titulo: "3 dias sem apostar", corpo: "Três dias. O impulso de recuperar o prejuízo é a armadilha central. Você não recupera apostando: você recupera parando." },
  { chave: "7d", ms: SEMANA, titulo: "1 SEMANA SEM APOSTAR", corpo: "Uma semana. Ansiedade menor, sono melhor e saldo intacto. Some o que você teria perdido nesses 7 dias." },
  { chave: "30d", ms: MES, titulo: "1 mês sem apostar", corpo: "Um mês. Seu dinheiro, sua atenção e sua paz voltaram a ser seus. Se ainda tem dívida, agora ela só diminui." },
  { chave: "90d", ms: 3 * MES, titulo: "3 meses sem apostar", corpo: "90 dias. Você quebrou o ciclo. Manter a autoexclusão ativa e apoio por perto protege o que você construiu." },
];

const CAFEINA: MarcoDef[] = [
  { chave: "12h", ms: 12 * HORA, titulo: "12 horas sem cafeína", corpo: "A cafeína já saiu quase toda do seu sangue. A dor de cabeça que pode vir é vasodilatação — passa em poucos dias." },
  { chave: "1d", ms: DIA, titulo: "24 horas sem cafeína", corpo: "Um dia. Seus receptores de adenosina começam a normalizar. Hidrate-se bem: reduz muito a dor de cabeça." },
  { chave: "2d", ms: 2 * DIA, titulo: "48 horas sem cafeína", corpo: "Aqui costuma ser o pico do desconforto. É o último empurrão — a partir daqui só melhora." },
  { chave: "7d", ms: SEMANA, titulo: "1 semana sem cafeína", corpo: "Uma semana. Seu sono profundo está mais longo e sua energia mais estável, sem os altos e baixos." },
  { chave: "30d", ms: MES, titulo: "1 mês sem cafeína", corpo: "Um mês. Ansiedade basal menor e sono reorganizado. Se voltar a tomar, será por prazer e não por dependência." },
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
      "Dependência de nicotina. A nicotina tem meia-vida de cerca de 2h e é eliminada por completo em cerca de 72h; depois disso a fissura é psicológica/condicionada, dura de 3 a 5 minutos por onda e diminui em frequência com o tempo. Gatilhos clássicos: café, álcool, pós-refeição, telefone, direção, estresse, ver alguém fumando, primeira hora do dia.",
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
      "Dependência de nicotina por vape/pod. Costuma gerar consumo contínuo ao longo do dia, o que mantém nicotina alta e cria um hábito motor muito frequente (levar a mão à boca). Eliminação completa em cerca de 72h.",
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
      "Redução/cessação de álcool. ATENÇÃO: em dependência física severa a abstinência pode ser perigosa (tremor intenso, confusão, convulsão) e exige acompanhamento médico. Gatilhos clássicos: sexta-feira, futebol, churrasco, briga, fim de expediente.",
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
      "Corte de açúcar adicionado/ultraprocessado. A fissura costuma ter pico em cerca de 72h e cair muito depois de 1-2 semanas, quando o paladar recalibra. Gatilhos: fim de refeição, cansaço à tarde, estresse, noite.",
    marcos: montar("sem açúcar", ACUCAR),
  },
  {
    id: "pornografia",
    rotulo: "Parar com pornografia",
    emoji: "🧠",
    sufixo: "limpo",
    unidade: "episódios",
    contexto:
      "Uso compulsivo de pornografia. O impulso é fortemente ligado a tédio, estresse, solidão e ao estar sozinho com o celular à noite. A estratégia central é mudar de ambiente e de estado físico quando o impulso chega.",
    marcos: montar("limpo", PORNOGRAFIA),
  },
  {
    id: "redes",
    rotulo: "Menos redes sociais",
    emoji: "📵",
    sufixo: "fora das redes",
    unidade: "sessões",
    contexto:
      "Uso compulsivo de redes sociais/celular. O loop é de recompensa variável: o impulso de checar aparece sem motivo consciente. Melhora com fricção (apps fora da tela inicial, sem notificação) e com substituição da ação.",
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
      "Jogo/aposta compulsiva. O pensamento mais perigoso é vou recuperar o que perdi. Autoexclusão nas plataformas, bloqueio de pagamento e apoio externo aumentam muito a chance de sucesso. No Brasil há apoio gratuito em grupos de Jogadores Anônimos e no CVV (188).",
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
      "Corte de cafeína. Abstinência típica: dor de cabeça, sonolência e irritabilidade, com pico em 24-48h e resolução em cerca de 7 dias. Reduzir gradualmente diminui muito o desconforto.",
    marcos: montar("sem cafeína", CAFEINA),
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
