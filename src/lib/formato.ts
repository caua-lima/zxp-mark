import { DIA, HORA, MIN, preset } from "@/lib/habitos";

/** "3d 14h 22m 08s" — usado no cronômetro ao vivo. */
export function duracao(ms: number): { d: number; h: number; m: number; s: number } {
  const t = Math.max(0, ms);
  return {
    d: Math.floor(t / DIA),
    h: Math.floor((t % DIA) / HORA),
    m: Math.floor((t % HORA) / MIN),
    s: Math.floor((t % MIN) / 1000),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function duracaoCurta(ms: number): string {
  const { d, h, m, s } = duracao(ms);
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  if (m > 0) return `${m}m ${pad(s)}s`;
  return `${s}s`;
}

/** Texto por extenso: "3 dias, 14 horas e 22 minutos". */
export function duracaoExtenso(ms: number): string {
  const { d, h, m } = duracao(ms);
  const partes: string[] = [];
  if (d > 0) partes.push(`${d} ${d === 1 ? "dia" : "dias"}`);
  if (h > 0) partes.push(`${h} ${h === 1 ? "hora" : "horas"}`);
  if (m > 0 && d === 0) partes.push(`${m} ${m === 1 ? "minuto" : "minutos"}`);
  if (partes.length === 0) return "menos de um minuto";
  if (partes.length === 1) return partes[0];
  return `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}`;
}

/** Rótulo curto do tempo de um marco: "6h", "3 dias", "1 ano". */
export function rotuloMs(ms: number): string {
  if (ms < HORA) return `${Math.round(ms / MIN)} min`;
  if (ms < DIA) return `${Math.round(ms / HORA)}h`;
  const dias = Math.round(ms / DIA);
  if (dias < 30) return `${dias} ${dias === 1 ? "dia" : "dias"}`;
  if (dias < 365) {
    const meses = Math.round(dias / 30);
    return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  }
  const anos = Math.round((dias / 365) * 10) / 10;
  return `${anos % 1 === 0 ? anos : anos.toFixed(1)} ${anos === 1 ? "ano" : "anos"}`;
}

export function reais(v: number): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: v >= 100 ? 0 : 2,
  });
}

export type MarcoLike = {
  preset: string;
  cicloInicio: Date | string;
  unidadesPorDia: number | null;
  gastoDiario: number | null;
};

/** Estatísticas derivadas de um marco: dinheiro, unidades e vida. */
export function impacto(m: MarcoLike, agora = Date.now()) {
  const inicio = new Date(m.cicloInicio).getTime();
  const decorrido = Math.max(0, agora - inicio);
  const dias = decorrido / DIA;
  const p = preset(m.preset);

  const unidades = m.unidadesPorDia ? m.unidadesPorDia * dias : null;
  const dinheiro = m.gastoDiario ? m.gastoDiario * dias : null;
  const minutosVida =
    unidades && p.minutosDeVidaPorUnidade ? unidades * p.minutosDeVidaPorUnidade : null;

  return {
    decorrido,
    dias,
    unidadesEvitadas: unidades === null ? null : Math.floor(unidades),
    dinheiroEconomizado: dinheiro,
    minutosDeVida: minutosVida === null ? null : Math.floor(minutosVida),
    unidadeNome: p.unidade,
  };
}

export function dataLonga(d: Date | string): string {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Hora local (0-23) de um usuário num fuso IANA. */
export function horaLocal(tz: string, quando = new Date()): number {
  try {
    const h = new Intl.DateTimeFormat("pt-BR", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    }).format(quando);
    return Number(h) % 24;
  } catch {
    return quando.getUTCHours();
  }
}

/** Data local no formato YYYY-MM-DD, para deduplicar avisos diários. */
export function diaLocal(tz: string, quando = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(quando);
  } catch {
    return quando.toISOString().slice(0, 10);
  }
}
