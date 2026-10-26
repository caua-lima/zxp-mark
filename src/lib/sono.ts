/**
 * Regras do registro de sono. Puro: sem banco, sem relógio global, sem alias.
 *
 * O que este módulo se recusa a fazer:
 *   - tratar noite sem registro como zero hora (não existe linha, não existe dia);
 *   - alegar precisão clínica: a duração é "do intervalo informado", não do
 *     sono efetivo — a pessoa pode ter demorado a dormir ou acordado de noite;
 *   - julgar. Nada aqui diz que dormir pouco é "ruim" ou que dormir mais é "melhor".
 */
import {
  DIA_MS,
  HORA_MS,
  MIN_MS,
  diaLocalDe,
  diferencaDias,
  instanteLocal,
} from "./datas.ts";

/** Mais que isso quase certamente é data errada (ontem vs. hoje). */
export const DURACAO_MAXIMA_MS = 24 * HORA_MS;
export const DURACAO_MINIMA_MS = 10 * MIN_MS;
/** Folga para relógios do celular um pouco adiantados. */
const TOLERANCIA_FUTURO_MS = 5 * MIN_MS;

export type EntradaSono = {
  /** relógio de parede no fuso do usuário: "2026-10-25T23:30" */
  dormiuEm: string;
  acordouEm: string;
  qualidade: number;
  nota?: string | null;
};

export type SonoNormalizado = {
  dormiuEm: Date;
  acordouEm: Date;
  qualidade: number;
  nota: string | null;
};

export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string };

export function duracaoMs(s: { dormiuEm: Date | number; acordouEm: Date | number }): number {
  return new Date(s.acordouEm).getTime() - new Date(s.dormiuEm).getTime();
}

/** "7h 30min", "45min" — sempre a duração do intervalo informado. */
export function formatarDuracao(ms: number): string {
  const min = Math.round(Math.max(0, ms) / MIN_MS);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

/**
 * Valida o que a pessoa digitou e devolve instantes reais. As mensagens de erro
 * são o texto que a pessoa lê — dizem o que fazer, não o que deu errado.
 */
export function interpretarSono(
  e: EntradaSono,
  tz: string,
  agora: Date | number = Date.now()
): Resultado<SonoNormalizado> {
  const dormiuEm = instanteLocal(e.dormiuEm ?? "", tz);
  const acordouEm = instanteLocal(e.acordouEm ?? "", tz);
  if (!dormiuEm || !acordouEm) {
    return { ok: false, erro: "Confira a data e a hora de dormir e de acordar." };
  }
  if (!Number.isInteger(e.qualidade) || e.qualidade < 1 || e.qualidade > 5) {
    return { ok: false, erro: "Escolha uma qualidade de 1 a 5." };
  }

  const dur = duracaoMs({ dormiuEm, acordouEm });
  if (dur <= 0) {
    return { ok: false, erro: "Você acordou antes de dormir. Confira as datas — talvez falte o dia." };
  }
  if (dur < DURACAO_MINIMA_MS) {
    return { ok: false, erro: "Esse intervalo ficou muito curto para um registro de sono." };
  }
  if (dur > DURACAO_MAXIMA_MS) {
    return { ok: false, erro: "Esse intervalo passa de 24 horas. Confira as datas." };
  }
  if (acordouEm.getTime() > new Date(agora).getTime() + TOLERANCIA_FUTURO_MS) {
    return { ok: false, erro: "Esse horário de acordar ainda não chegou." };
  }

  const nota = (e.nota ?? "").trim();
  if (nota.length > 500) {
    return { ok: false, erro: "A observação aceita até 500 caracteres." };
  }

  return {
    ok: true,
    valor: { dormiuEm, acordouEm, qualidade: e.qualidade, nota: nota || null },
  };
}

type Intervalo = { id?: string; dormiuEm: Date | number; acordouEm: Date | number };

/**
 * Já existe outro registro ocupando esse intervalo? Encostar não é sobrepor:
 * acordar às 07:00 e voltar a dormir às 07:00 é válido.
 */
export function registroSobreposto(
  novo: Intervalo,
  existentes: Intervalo[],
  ignorarId?: string
): Intervalo | null {
  const a0 = new Date(novo.dormiuEm).getTime();
  const a1 = new Date(novo.acordouEm).getTime();
  for (const e of existentes) {
    if (ignorarId && e.id === ignorarId) continue;
    const b0 = new Date(e.dormiuEm).getTime();
    const b1 = new Date(e.acordouEm).getTime();
    if (a0 < b1 && b0 < a1) return e;
  }
  return null;
}

/**
 * A "noite" é datada pelo dia local em que a pessoa ACORDOU: dormir às 23h de
 * segunda e acordar às 7h de terça é a noite de terça. Cochilos do mesmo dia
 * somam na mesma data.
 */
export function diaDoRegistro(s: { acordouEm: Date | number }, tz: string): string {
  return diaLocalDe(s.acordouEm, tz);
}

export type DiaDeSono = {
  /** "YYYY-MM-DD" local */
  dia: string;
  /** null = sem registro. Nunca 0: zero horas seria uma afirmação. */
  totalMs: number | null;
  registros: number;
  qualidadeMedia: number | null;
};

export type ResumoSono = {
  /** sempre 7 posições, do dia mais antigo até hoje */
  dias: DiaDeSono[];
  /** dias da janela que têm ao menos um registro */
  noitesRegistradas: number;
  /** média só dos dias COM registro; null se não há nenhum */
  mediaMs: number | null;
  qualidadeMedia: number | null;
};

type RegistroResumo = { dormiuEm: Date | number; acordouEm: Date | number; qualidade: number };

/** Os últimos `janela` dias locais, terminando hoje, com o que existe de dado. */
export function resumirSono(
  registros: RegistroResumo[],
  tz: string,
  agora: Date | number = Date.now(),
  janela = 7
): ResumoSono {
  const hoje = diaLocalDe(agora, tz);

  // Lista de dias da janela, do mais antigo ao mais novo. Fazemos a conta em
  // dias de calendário (e não "agora - n*24h") para a troca de horário de
  // verão não pular nem repetir um dia.
  const [ano, mes, dia] = hoje.split("-").map(Number);
  const dias: DiaDeSono[] = [];
  for (let i = janela - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(ano, mes - 1, dia - i));
    dias.push({
      dia: d.toISOString().slice(0, 10),
      totalMs: null,
      registros: 0,
      qualidadeMedia: null,
    });
  }
  const porDia = new Map(dias.map((d) => [d.dia, d]));
  const somaQualidade = new Map<string, number>();

  for (const r of registros) {
    const alvo = porDia.get(diaDoRegistro(r, tz));
    if (!alvo) continue;
    alvo.totalMs = (alvo.totalMs ?? 0) + duracaoMs(r);
    alvo.registros += 1;
    somaQualidade.set(alvo.dia, (somaQualidade.get(alvo.dia) ?? 0) + r.qualidade);
  }
  for (const d of dias) {
    if (d.registros > 0) d.qualidadeMedia = (somaQualidade.get(d.dia) ?? 0) / d.registros;
  }

  const comDado = dias.filter((d) => d.totalMs !== null);
  const mediaMs = comDado.length
    ? comDado.reduce((s, d) => s + (d.totalMs as number), 0) / comDado.length
    : null;
  const qualidades = comDado.map((d) => d.qualidadeMedia as number);
  const qualidadeMedia = qualidades.length
    ? qualidades.reduce((s, q) => s + q, 0) / qualidades.length
    : null;

  return { dias, noitesRegistradas: comDado.length, mediaMs, qualidadeMedia };
}

/**
 * Quantos dias distintos têm registro, desde sempre. É o que a progressão
 * conta: dormir mais não rende nada, registrar rende — e um período sem
 * registrar não apaga o que já foi registrado.
 */
export function diasComRegistro(
  registros: { acordouEm: Date | number }[],
  tz: string
): number {
  return new Set(registros.map((r) => diaDoRegistro(r, tz))).size;
}

/** Quantos dias separam o último registro de hoje (null se nunca registrou). */
export function diasDesdeUltimoRegistro(
  registros: { acordouEm: Date | number }[],
  tz: string,
  agora: Date | number = Date.now()
): number | null {
  if (registros.length === 0) return null;
  const ultimo = Math.max(...registros.map((r) => new Date(r.acordouEm).getTime()));
  return Math.max(0, diferencaDias(diaLocalDe(ultimo, tz), diaLocalDe(agora, tz)));
}

/** Sugestão para o formulário: dormiu 23:00 de ontem, acordou 07:00 de hoje. */
export function sugestaoDeHorarios(
  tz: string,
  agora: Date | number = Date.now()
): { dormiuEm: string; acordouEm: string } {
  const hoje = diaLocalDe(agora, tz);
  const [ano, mes, dia] = hoje.split("-").map(Number);
  const ontem = new Date(Date.UTC(ano, mes - 1, dia - 1)).toISOString().slice(0, 10);
  return { dormiuEm: `${ontem}T23:00`, acordouEm: `${hoje}T07:00` };
}

export { DIA_MS };
