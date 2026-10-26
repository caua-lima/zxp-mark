/**
 * Regras de data e fuso do ZXP Mark — a única fonte da verdade.
 *
 * Sem imports de propósito: roda no servidor, no navegador e nos testes do
 * Node sem nenhum alias. Toda decisão sobre "que dia é" passa por aqui.
 *
 * Duas palavras que NÃO são sinônimas, e que a interface usa de propósito:
 *
 *   - "dias completos": blocos de 24 horas já vividos desde o início.
 *       Começou ontem às 22h, agora são 00h05 → 0 dias completos.
 *   - "dia N": o número do dia no calendário local, contando o dia do início
 *       como dia 1. No mesmo exemplo, já é o dia 2.
 *
 * Confundir os dois é o erro clássico de virada de dia: o contador diz
 * "1 dia" duas horas depois de começar.
 */

export const MIN_MS = 60_000;
export const HORA_MS = 60 * MIN_MS;
export const DIA_MS = 24 * HORA_MS;

export const FUSO_PADRAO = "America/Sao_Paulo";

/** O fuso existe? Nome inválido faz o Intl lançar RangeError. */
export function fusoValido(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Fuso do usuário, caindo no padrão se o salvo estiver vazio ou inválido. */
export function fusoSeguro(tz: string | null | undefined): string {
  return tz && fusoValido(tz) ? tz : FUSO_PADRAO;
}

export type Partes = {
  ano: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
  segundo: number;
};

/** Relógio de parede de um instante num fuso. */
export function partesNoFuso(instante: Date | number, tz: string): Partes {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    // h23, porque "h24" faz meia-noite virar "24" em alguns motores.
    hourCycle: "h23",
  });
  const mapa: Record<string, number> = {};
  for (const p of f.formatToParts(new Date(instante))) {
    if (p.type !== "literal") mapa[p.type] = Number(p.value);
  }
  return {
    ano: mapa.year,
    mes: mapa.month,
    dia: mapa.day,
    hora: mapa.hour,
    minuto: mapa.minute,
    segundo: mapa.second,
  };
}

const p2 = (n: number) => String(n).padStart(2, "0");

/** Dia local do instante, "YYYY-MM-DD". */
export function diaLocalDe(instante: Date | number, tz: string): string {
  const p = partesNoFuso(instante, tz);
  return `${p.ano}-${p2(p.mes)}-${p2(p.dia)}`;
}

/** Relógio de parede no formato do <input type="datetime-local">. */
export function textoLocal(instante: Date | number, tz: string): string {
  const p = partesNoFuso(instante, tz);
  return `${p.ano}-${p2(p.mes)}-${p2(p.dia)}T${p2(p.hora)}:${p2(p.minuto)}`;
}

/** Quanto o relógio de parede do fuso está à frente do UTC naquele instante. */
export function deslocamentoMs(tz: string, instante: Date | number): number {
  const t = new Date(instante).getTime();
  const p = partesNoFuso(t, tz);
  const comoUtc = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo);
  return comoUtc - Math.floor(t / 1000) * 1000;
}

const RE_LOCAL = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/;

/**
 * Converte um relógio de parede ("2026-11-13T09:00" ou só "2026-11-13") no
 * instante real, interpretado no fuso do usuário — e não no do servidor, que
 * na Vercel é UTC. Sem hora, vale 00:00 local.
 *
 * Devolve null para o que não existe: "2026-02-30", hora 25, ou um horário
 * que o relógio pulou na troca de horário de verão.
 */
export function instanteLocal(texto: string, tz: string): Date | null {
  const m = RE_LOCAL.exec(texto.trim());
  if (!m) return null;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const hora = m[4] === undefined ? 0 : Number(m[4]);
  const minuto = m[5] === undefined ? 0 : Number(m[5]);
  const segundo = m[6] === undefined ? 0 : Number(m[6]);

  const ingenuo = Date.UTC(ano, mes - 1, dia, hora, minuto, segundo);
  // Duas passadas: o deslocamento muda quando o palpite cai do outro lado de
  // uma troca de horário.
  let candidato = ingenuo - deslocamentoMs(tz, ingenuo);
  candidato = ingenuo - deslocamentoMs(tz, candidato);

  // Tem que voltar igual: é o que separa 30 de fevereiro de uma data de verdade.
  const volta = partesNoFuso(candidato, tz);
  if (
    volta.ano !== ano ||
    volta.mes !== mes ||
    volta.dia !== dia ||
    volta.hora !== hora ||
    volta.minuto !== minuto
  ) {
    return null;
  }
  return new Date(candidato);
}

/** Diferença inteira, em dias, entre dois "YYYY-MM-DD" (b - a). */
export function diferencaDias(a: string, b: string): number {
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / DIA_MS);
}

/** "1 dia completo": blocos de 24h vividos desde o início. Nunca negativo. */
export function diasCompletos(inicio: Date | number, agora: Date | number): number {
  const ms = new Date(agora).getTime() - new Date(inicio).getTime();
  return ms <= 0 ? 0 : Math.floor(ms / DIA_MS);
}

/** "Dia N": o dia do início é o dia 1. Nunca menor que 1. */
export function diaCalendario(
  inicio: Date | number,
  agora: Date | number,
  tz: string
): number {
  const n = diferencaDias(diaLocalDe(inicio, tz), diaLocalDe(agora, tz)) + 1;
  return Math.max(1, n);
}

export type EstadoRegressiva =
  | { tipo: "futura"; dias: number; restanteMs: number }
  | { tipo: "hoje"; dias: 0 }
  | { tipo: "concluida"; dias: number };

/**
 * Onde uma contagem regressiva está, sem nunca produzir número negativo.
 *
 *   futura     → ainda não chegou; `dias` são dias cheios que faltam
 *   hoje       → o instante passou, mas ainda é o mesmo dia local do evento
 *   concluida  → o dia já ficou para trás; `dias` = há quantos dias foi
 */
export function estadoRegressiva(
  alvo: Date | number,
  agora: Date | number,
  tz: string
): EstadoRegressiva {
  const restanteMs = new Date(alvo).getTime() - new Date(agora).getTime();
  if (restanteMs > 0) {
    return { tipo: "futura", dias: Math.floor(restanteMs / DIA_MS), restanteMs };
  }
  const desde = diferencaDias(diaLocalDe(alvo, tz), diaLocalDe(agora, tz));
  if (desde <= 0) return { tipo: "hoje", dias: 0 };
  return { tipo: "concluida", dias: desde };
}
