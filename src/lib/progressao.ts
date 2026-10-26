/**
 * Progressão: a trilha de etapas por onde a pessoa anda.
 *
 * Uma só estrutura serve os três tipos de acompanhamento — hábito (marco),
 * contagem crescente e sono — para não existirem dois sistemas de "conquista"
 * dizendo coisas diferentes sobre a mesma informação. O que muda entre eles é
 * só a unidade do limiar: milissegundos de tempo corrido, ou noites registradas.
 *
 * Princípios que moram aqui (e têm teste):
 *   - uma etapa concluída nunca "desconclui": a trilha só cresce;
 *   - celebrar é raro: só etapa relevante ganha celebração grande;
 *   - a etapa de abertura da trilha aparece concluída mas nunca comemora;
 *   - nada aqui compara a pessoa com outras nem premia consumo.
 */
import { preset } from "./habitos.ts";
import { DIA_MS } from "./datas.ts";

export type TipoProgresso = "marco" | "acompanhamento" | "sono";

export type Etapa = {
  /** estável: é a chave de deduplicação das celebrações */
  chave: string;
  /** milissegundos (marco, acompanhamento) ou noites registradas (sono) */
  limiar: number;
  titulo: string;
  /** só etapa relevante recebe celebração grande */
  relevante: boolean;
  /** abertura da trilha: aparece concluída, mas não comemora */
  inicial?: boolean;
};

export type EstadoEtapa = "concluida" | "atual" | "proxima";
export type EtapaComEstado = Etapa & { estado: EstadoEtapa };

export type Posicao = {
  etapas: EtapaComEstado[];
  /** última etapa concluída (sem contar a abertura) */
  ultima: Etapa | null;
  /** o próximo alvo; null quando a trilha acabou */
  atual: Etapa | null;
  /** 0..1 entre a última concluída e o próximo alvo */
  progresso: number;
  /** quanto falta, na unidade do limiar */
  falta: number;
  concluidas: number;
  total: number;
};

export const CHAVE_BASE = "_base";
export const EPOCA = new Date(0);

/* ----------------------------- catálogos ---------------------------------- */

const ABERTURA: Etapa = { chave: "inicio", limiar: 0, titulo: "Início", relevante: false, inicial: true };

/** Marcos que merecem celebração grande: dia, semana, mês, trimestre, ano... */
const RELEVANTES_MARCO = new Set(["1d", "7d", "30d", "90d", "180d", "1a", "2a", "5a", "10a"]);

export function etapasDoMarco(presetId: string): Etapa[] {
  const p = preset(presetId);
  return [
    ABERTURA,
    ...p.marcos.map((m) => ({
      chave: m.chave,
      limiar: m.ms,
      titulo: m.titulo,
      relevante: RELEVANTES_MARCO.has(m.chave),
    })),
  ];
}

/**
 * Contagem crescente: etapas de TEMPO acompanhando. São marcos de
 * engajamento — "uma semana desde o início" — e não prazos de melhora de nada.
 */
const TEMPO_ACOMPANHANDO: { chave: string; dias: number; titulo: string; relevante: boolean }[] = [
  { chave: "3d", dias: 3, titulo: "3 dias", relevante: false },
  { chave: "7d", dias: 7, titulo: "1 semana", relevante: true },
  { chave: "14d", dias: 14, titulo: "2 semanas", relevante: false },
  { chave: "30d", dias: 30, titulo: "1 mês", relevante: true },
  { chave: "60d", dias: 60, titulo: "2 meses", relevante: false },
  { chave: "90d", dias: 90, titulo: "3 meses", relevante: true },
  { chave: "180d", dias: 180, titulo: "6 meses", relevante: false },
  { chave: "365d", dias: 365, titulo: "1 ano", relevante: true },
];

export function etapasDoAcompanhamento(): Etapa[] {
  return [
    { chave: "inicio", limiar: 0, titulo: "Primeiro registro", relevante: false, inicial: true },
    ...TEMPO_ACOMPANHANDO.map((e) => ({
      chave: e.chave,
      limiar: e.dias * DIA_MS,
      titulo: e.titulo,
      relevante: e.relevante,
    })),
  ];
}

/** Sono: o que se conta é o HÁBITO DE REGISTRAR, nunca quanto a pessoa dorme. */
const NOITES: { n: number; relevante: boolean }[] = [
  { n: 1, relevante: false },
  { n: 3, relevante: false },
  { n: 7, relevante: true },
  { n: 14, relevante: false },
  { n: 30, relevante: true },
  { n: 60, relevante: false },
  { n: 100, relevante: true },
];

export function etapasDoSono(): Etapa[] {
  return [
    { chave: "inicio", limiar: 0, titulo: "Começar a registrar", relevante: false, inicial: true },
    ...NOITES.map(({ n, relevante }) => ({
      chave: `n${n}`,
      limiar: n,
      titulo: n === 1 ? "Primeira noite registrada" : `${n} noites registradas`,
      relevante,
    })),
  ];
}

/* ------------------------------ posição ----------------------------------- */

/** Chaves das etapas já atingidas — sem a abertura, que não comemora. */
export function alcancadas(etapas: Etapa[], valor: number): string[] {
  return etapas.filter((e) => !e.inicial && e.limiar <= valor).map((e) => e.chave);
}

export function posicionar(etapas: Etapa[], valor: number): Posicao {
  const v = Math.max(0, valor);
  const ordenadas = [...etapas].sort((a, b) => a.limiar - b.limiar);
  const proximo = ordenadas.find((e) => e.limiar > v) ?? null;
  const concluidasLista = ordenadas.filter((e) => e.limiar <= v);
  const ultimaAny = concluidasLista[concluidasLista.length - 1] ?? null;

  const comEstado: EtapaComEstado[] = ordenadas.map((e) => ({
    ...e,
    estado: e.limiar <= v ? "concluida" : e === proximo ? "atual" : "proxima",
  }));

  const base = ultimaAny?.limiar ?? 0;
  const progresso = proximo ? Math.max(0, Math.min(1, (v - base) / (proximo.limiar - base))) : 1;

  return {
    etapas: comEstado,
    ultima: ultimaAny && !ultimaAny.inicial ? ultimaAny : null,
    atual: proximo,
    progresso,
    falta: proximo ? proximo.limiar - v : 0,
    concluidas: concluidasLista.filter((e) => !e.inicial).length,
    total: ordenadas.filter((e) => !e.inicial).length,
  };
}

/**
 * Pedaço da trilha que cabe na tela, centrado no alvo atual. Devolve também
 * quantas etapas ficaram escondidas de cada lado, para a interface dizer "+4".
 */
export function janela<T extends { estado: EstadoEtapa }>(
  etapas: T[],
  tamanho = 6
): { itens: T[]; antes: number; depois: number } {
  if (etapas.length <= tamanho) return { itens: etapas, antes: 0, depois: 0 };
  const iAtual = etapas.findIndex((e) => e.estado === "atual");
  const centro = iAtual === -1 ? etapas.length - 1 : iAtual;
  const inicio = Math.max(0, Math.min(etapas.length - tamanho, centro - Math.floor(tamanho / 2)));
  return {
    itens: etapas.slice(inicio, inicio + tamanho),
    antes: inicio,
    depois: etapas.length - (inicio + tamanho),
  };
}

/* ----------------------------- celebrações -------------------------------- */

export type Celebracao = {
  etapa: Etapa;
  /** "grande" só para etapa relevante; o resto é um aceno discreto */
  nivel: "grande" | "discreta";
  /** outras etapas que também foram atingidas entre uma visita e outra */
  outras: number;
};

/**
 * Qual celebração mostrar, dado o que foi atingido e o que já foi visto.
 *
 * Se várias etapas ficaram pendentes (a pessoa passou dias sem abrir o app),
 * mostra UMA — a mais avançada, que carrega as anteriores — em vez de uma fila
 * de modais. As demais viram o "+N" do texto.
 */
export function escolherCelebracao(
  etapas: Etapa[],
  atingidas: string[],
  vistas: ReadonlySet<string>
): Celebracao | null {
  const pendentes = etapas
    .filter((e) => !e.inicial && atingidas.includes(e.chave) && !vistas.has(e.chave))
    .sort((a, b) => b.limiar - a.limiar);
  if (pendentes.length === 0) return null;

  // Entre as pendentes, uma relevante pesa mais que a mais avançada irrelevante.
  const destaque = pendentes.find((e) => e.relevante) ?? pendentes[0];
  return {
    etapa: destaque,
    nivel: destaque.relevante ? "grande" : "discreta",
    outras: pendentes.length - 1,
  };
}

/* ------------------------------- textos ----------------------------------- */

/**
 * Retomada sem culpa: nunca fala em "quebrou", "perdeu" ou "falhou", e sempre
 * lembra que o que já existe continua existindo.
 */
export function textoRetomada(tipo: TipoProgresso, diasSemRegistro: number | null): string | null {
  if (tipo !== "sono") return null;
  if (diasSemRegistro === null) return null;
  if (diasSemRegistro < 3) return null;
  return "Faz alguns dias sem registro — tudo bem. O que você já registrou continua aqui; quando quiser, é só anotar a próxima noite.";
}
