/**
 * Textos das notificações.
 *
 * A diferença entre um app que avisa e um app que acompanha está aqui. Uma
 * contagem regressiva não é um cronômetro: é a recompensa de um trabalho que
 * está acontecendo agora. A mensagem precisa dizer isso — com o número exato,
 * sem repetir o de ontem, e mudando de tom conforme a data chega.
 */
import { diasEHoras, duracaoExtenso, reais } from "@/lib/formato";

export type Texto = { titulo: string; corpo: string };

/** Varia por dia sem sortear: mesma data, mesma mensagem; dia seguinte, outra. */
function escolher<T>(lista: T[], semente: number): T {
  return lista[Math.abs(Math.floor(semente)) % lista.length];
}

/* ------------------------- contagem regressiva --------------------------- */

export type ContextoContagem = {
  titulo: string;
  emoji: string;
  descricao: string | null;
  /** tempo que falta, em ms */
  faltaMs: number;
  /** dias de calendário que faltam */
  dias: number;
  /** fração já percorrida desde que a contagem foi criada (0 a 1) */
  progresso: number;
  /** sequência em andamento, quando existe — amarra as duas coisas */
  marco?: { sufixo: string; decorridoMs: number; dinheiro: number | null } | null;
  /** número do dia, para variar a frase */
  semente: number;
};

/**
 * Faixas por proximidade. O tom muda: longe é "mantenha o ritmo", perto é
 * "arruma a mala". Cada faixa tem várias frases para não repetir na semana.
 */
const FAIXAS: { ate: number; frases: ((c: ContextoContagem) => string)[] }[] = [
  {
    ate: 0,
    frases: [
      () => "É HOJE. Acabou a espera — e você chegou aqui inteiro. Aproveita cada minuto, você pagou por ele.",
      () => "Chegou o dia. Todo aquele trabalho era exatamente por isso. Vai lá.",
      () => "É hoje! Olha o tanto de dia que você riscou até aqui. Hoje é o prêmio.",
    ],
  },
  {
    ate: 1,
    frases: [
      (c) => `É AMANHÃ. Faltam ${diasEHoras(c.faltaMs)}. Hoje é só arrumar a mala e dormir cedo — o trabalho já foi feito.`,
      () => "Amanhã. Depois de tanto dia contado, o último é sempre o mais longo. Segura mais um.",
      (c) => `Falta 1 dia — ${diasEHoras(c.faltaMs)}, pra ser exato. Confere o que falta e relaxa.`,
    ],
  },
  {
    ate: 3,
    frases: [
      (c) => `Faltam ${diasEHoras(c.faltaMs)}. Dá pra contar nos dedos agora. Parabéns por ter chegado até aqui.`,
      (c) => `${c.dias} dias. A ansiedade boa já bateu? Era pra ter batido. Aguenta mais um pouquinho.`,
      () => "Reta final de verdade. Tudo que você fez nas últimas semanas desemboca aqui.",
    ],
  },
  {
    ate: 7,
    frases: [
      (c) => `Faltam ${diasEHoras(c.faltaMs)} — é ESSA semana. Parabéns pelo trabalho, é exatamente por isso que você vem acordando cedo.`,
      (c) => `${c.dias} dias. Já dá pra começar a planejar o que vai levar. Você merece.`,
      () => "Essa semana. Mantém o foco até sexta que o prêmio já está marcado no calendário.",
      (c) => `Menos de uma semana: ${diasEHoras(c.faltaMs)}. Cada dia trabalhado até aqui comprou esse.`,
    ],
  },
  {
    ate: 14,
    frases: [
      (c) => `Faltam ${diasEHoras(c.faltaMs)}. Duas semaninhas. Continua o trabalho — a recompensa já tem data.`,
      (c) => `${c.dias} dias. Parabéns: você passou da metade mais difícil, que é a que ninguém vê.`,
      () => "Menos de duas semanas. Mantém o ritmo que já está no fim.",
      (c) => `${diasEHoras(c.faltaMs)}. Daqui a duas semanas você vai olhar pra trás e achar que passou voando.`,
    ],
  },
  {
    ate: 30,
    frases: [
      (c) => `Faltam ${diasEHoras(c.faltaMs)}. Parabéns pelo trabalho até aqui — é por isso que ele existe.`,
      (c) => `${c.dias} dias. Menos de um mês. Continua firme que o calendário está trabalhando a seu favor.`,
      () => "Entrou no mês. Daqui pra frente cada dia riscado pesa mais.",
      (c) => `${diasEHoras(c.faltaMs)}. Mantém o foco: o que você faz nas próximas semanas é o que vai deixar isso tranquilo.`,
    ],
  },
  {
    ate: 60,
    frases: [
      (c) => `Faltam ${diasEHoras(c.faltaMs)}. Parabéns pela constância — é ela que paga essa conta.`,
      (c) => `${c.dias} dias. Dois meses passam rápido quando tem motivo. E você tem.`,
      () => "Continua o trabalho. Essa data não vem sozinha: ela vem porque você está construindo ela.",
      (c) => `${diasEHoras(c.faltaMs)}. Ainda dá tempo de chegar lá do jeito que você quer.`,
    ],
  },
  {
    ate: 120,
    frases: [
      (c) => `Faltam ${diasEHoras(c.faltaMs)}. Parece longe, mas ontem eram ${c.dias + 1}. É assim que acaba chegando.`,
      (c) => `${c.dias} dias. Mantém o foco — quem planeja com essa antecedência é quem chega inteiro.`,
      () => "Continua firme. O trabalho de hoje é o que vai fazer esse dia valer a pena.",
      (c) => `${diasEHoras(c.faltaMs)}. Hoje é mais um dia riscado. Era pra ser.`,
    ],
  },
  {
    ate: Number.POSITIVE_INFINITY,
    frases: [
      (c) => `Faltam ${c.dias} dias. Longe? Está. Mas é exatamente por isso que você está trabalhando agora.`,
      (c) => `${c.dias} dias. Um por vez. Hoje você tirou mais um da conta.`,
      () => "Continua o trabalho. A data está marcada e ela não vai sair do lugar.",
    ],
  },
];

/** Fecho que amarra a contagem ao hábito — só aparece quando há sequência. */
function fechoDoMarco(c: ContextoContagem): string | null {
  const m = c.marco;
  if (!m || m.decorridoMs <= 0) return null;

  // No dia, o verbo tem que estar no passado: a pessoa já chegou.
  const verbo = c.dias <= 0 ? "E você chegou aqui com" : "E você chega lá com";
  const base = `${verbo} ${duracaoExtenso(m.decorridoMs)} ${m.sufixo}`;
  return m.dinheiro && m.dinheiro >= 20
    ? `${base} e ${reais(m.dinheiro)} no bolso.`
    : `${base}.`;
}

export function textoContagem(c: ContextoContagem): Texto {
  const faixa = FAIXAS.find((f) => c.dias <= f.ate)!;
  const frase = escolher(faixa.frases, c.semente)(c);

  const titulo =
    c.dias === 0
      ? `${c.emoji} É HOJE: ${c.titulo}`
      : c.dias === 1
        ? `${c.emoji} É amanhã: ${c.titulo}`
        : `${c.emoji} Faltam ${c.dias} dias para ${c.titulo}`;

  const linhas = [frase];

  const fecho = fechoDoMarco(c);
  if (fecho) linhas.push(fecho);

  if (c.descricao?.trim() && c.dias <= 7) linhas.push(c.descricao.trim());

  return { titulo, corpo: linhas.join("\n\n") };
}

/* --------------------------- foco do meio-dia ---------------------------- */

export type ContextoFoco = {
  primeiroNome: string;
  sufixo: string;
  decorridoMs: number;
  proximoTitulo: string | null;
  proximoFaltaMs: number | null;
  dinheiro: number | null;
  /** contagem mais próxima, para lembrar pelo que o esforço está sendo feito */
  recompensa: { titulo: string; dias: number } | null;
  semente: number;
};

const FOCO = [
  (f: ContextoFoco) => `Metade do dia e você continua firme: ${duracaoExtenso(f.decorridoMs)} ${f.sufixo}.`,
  (f: ContextoFoco) => `${duracaoExtenso(f.decorridoMs)} ${f.sufixo}. Mantém o foco — a tarde é onde a maioria escorrega.`,
  (f: ContextoFoco) => `Check do meio-dia: ${duracaoExtenso(f.decorridoMs)} ${f.sufixo}. Continua o trabalho.`,
  (f: ContextoFoco) => `Você está ${duracaoExtenso(f.decorridoMs)} ${f.sufixo}. Não é pouco. Segue.`,
];

export function textoFoco(f: ContextoFoco): Texto {
  const linhas = [escolher(FOCO, f.semente)(f)];

  if (f.recompensa) {
    const { titulo, dias } = f.recompensa;
    linhas.push(
      dias === 0
        ? `E é hoje que ${titulo} acontece. Era por isso.`
        : `Faltam ${dias} ${dias === 1 ? "dia" : "dias"} para ${titulo}. É por isso que você está segurando.`
    );
  } else if (f.proximoTitulo && f.proximoFaltaMs !== null) {
    linhas.push(`Próximo marco: ${f.proximoTitulo}, em ${duracaoExtenso(f.proximoFaltaMs)}.`);
  }

  if (!f.recompensa && f.dinheiro && f.dinheiro >= 20) {
    linhas.push(`${reais(f.dinheiro)} economizados até agora.`);
  }

  return { titulo: `Mantenha o foco, ${f.primeiroNome}`, corpo: linhas.join("\n\n") };
}
