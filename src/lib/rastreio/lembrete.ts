/**
 * Lembrete de medicamento: a decisão de enviar (ou não) e o TEXTO, sem tocar em banco ou push.
 *
 * Três regras de privacidade e de cuidado moram aqui, onde dá para testá-las:
 *  1. Só existe se a pessoa ligou o lembrete E informou um horário.
 *  2. O texto padrão é neutro: não cita medicamento, dose nem tratamento. Nome e dose só
 *     aparecem na tela bloqueada se a pessoa escolheu o texto detalhado.
 *  3. Nunca pressiona: não cita sequência, dias seguidos nem "não perca". Quem já registrou
 *     o dia (tomou ou não tomou) não recebe nada.
 */

export type EntradaLembrete = {
  lembrete: boolean;
  lembreteDetalhado: boolean;
  /** "HH:mm", conforme a prescrição que a pessoa informou */
  horario: string | null;
  arquivado: boolean;
  nome: string;
  /** descrição da dose informada, se houver; só usada no texto detalhado */
  dose: string | null;
  /** já existe registro de tomada (qualquer estado) para hoje */
  registradoHoje: boolean;
  /** minutos desde 00:00 no fuso da pessoa */
  minutosAgora: number;
};

export type TextoLembrete = { titulo: string; corpo: string };

/** O lembrete sai a partir do horário e vale por esta janela; depois disso, silêncio (não insiste). */
export const JANELA_LEMBRETE_MIN = 120;

const HORARIO = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function minutosDoHorario(horario: string | null): number | null {
  const m = horario ? HORARIO.exec(horario) : null;
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Minutos desde 00:00 no fuso informado. */
export function minutosLocais(tz: string, quando: Date): number {
  try {
    const partes = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(quando);
    const h = Number(partes.find((p) => p.type === "hour")?.value) % 24;
    const m = Number(partes.find((p) => p.type === "minute")?.value);
    return h * 60 + m;
  } catch {
    return quando.getUTCHours() * 60 + quando.getUTCMinutes();
  }
}

export function decidirLembrete(e: EntradaLembrete): TextoLembrete | null {
  if (!e.lembrete || e.arquivado || e.registradoHoje) return null;
  const alvo = minutosDoHorario(e.horario);
  if (alvo === null) return null;
  const passou = e.minutosAgora - alvo;
  if (passou < 0 || passou >= JANELA_LEMBRETE_MIN) return null;

  if (!e.lembreteDetalhado) {
    return { titulo: "ZXP Mark", corpo: "Seu lembrete de hoje. Se esquecer, é só marcar no app." };
  }
  const dose = e.dose ? ` Dose informada: ${e.dose}.` : "";
  return { titulo: `Lembrete: ${e.nome}`, corpo: `Se esquecer, é só marcar no app.${dose}` };
}
