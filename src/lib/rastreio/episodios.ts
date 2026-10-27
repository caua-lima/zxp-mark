/**
 * Regras do acompanhamento de hábito por EPISÓDIOS (roer unhas).
 *
 * Três coisas que o contador nunca confunde:
 *
 *   - episódio informado  → a pessoa registrou que roeu.
 *   - dia confirmado      → a pessoa registrou "hoje não roí".
 *   - dia sem informação  → não há registro nenhum. NÃO significa que não roeu.
 *
 * Por isso a sequência "N dias sem roer, conforme seus registros" só conta dias
 * CONFIRMADOS e consecutivos. O tempo que passou sem registro aparece em outro
 * texto ("N dias desde o início informado") e nunca é vendido como conquista.
 *
 * Puro e sem alias: roda no Node, no servidor e no navegador.
 */
import { DIA_MS, diaLocalDe, diferencaDias, instanteLocal } from "../datas.ts";
import type { Marco } from "../conhecimento/tipos.ts";

export type TipoEvento = "episodio" | "vontade" | "dia_sem" | "pratica";
export const CONTEXTOS = ["trabalho", "estudo", "tedio", "tensao", "outro"] as const;
export type Contexto = (typeof CONTEXTOS)[number];

export const ROTULO_CONTEXTO: Record<Contexto, string> = {
  trabalho: "Trabalho",
  estudo: "Estudo",
  tedio: "Tédio",
  tensao: "Tensão",
  outro: "Outro",
};

export type EventoRegistro = {
  tipo: string;
  /** "YYYY-MM-DD" no fuso do usuário */
  dia: string;
  contexto?: string | null;
  estrategia?: string | null;
  intensidade?: number | null;
  desconforto?: number | null;
  aparencia?: number | null;
  valor?: number | null;
};

export type EstadoDia = "episodio" | "confirmado" | "sem_informacao";

/** Soma `n` dias a um "YYYY-MM-DD" (n pode ser negativo), pelo calendário. */
export function somarDias(dia: string, n: number): string {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

/**
 * Estado de um dia. Se houver episódio, ele vence uma confirmação do mesmo dia:
 * a confirmação nunca esconde um episódio.
 */
export function estadoDoDia(eventos: EventoRegistro[], dia: string): EstadoDia {
  const doDia = eventos.filter((e) => e.dia === dia);
  if (doDia.some((e) => e.tipo === "episodio")) return "episodio";
  if (doDia.some((e) => e.tipo === "dia_sem")) return "confirmado";
  return "sem_informacao";
}

export type ResumoEpisodios = {
  hoje: string;
  /** primeiro dia do acompanhamento (a contagem nunca vem de antes) */
  inicioDia: string;
  /** dia do último episódio informado, ou null */
  ultimoEpisodio: string | null;
  /** dias de calendário desde o último episódio (ou desde o início, se não houve) */
  diasDesdeReferencia: number;
  referencia: "episodio" | "inicio";
  /** dias consecutivos CONFIRMADOS, terminando hoje ou ontem */
  sequenciaConfirmada: number;
  /** primeiro dia da sequência confirmada atual; null se não há */
  inicioDaSequencia: string | null;
  /** dias, entre a referência e ontem, sem nenhuma informação */
  diasSemInformacao: number;
  totalEpisodios: number;
  totalVontades: number;
  totalDiasConfirmados: number;
};

/**
 * Resume os registros. `inicioDia` é o dia em que a pessoa começou a acompanhar:
 * dias anteriores a ele não existem para o app.
 */
export function resumir(eventos: EventoRegistro[], inicioDia: string, agora: number, tz: string): ResumoEpisodios {
  const hoje = diaLocalDe(agora, tz);

  const diasDeEpisodio = eventos
    .filter((e) => e.tipo === "episodio" && e.dia >= inicioDia && e.dia <= hoje)
    .map((e) => e.dia)
    .sort();
  const ultimoEpisodio = diasDeEpisodio.length ? diasDeEpisodio[diasDeEpisodio.length - 1] : null;

  const referenciaDia = ultimoEpisodio ?? inicioDia;
  const diasDesdeReferencia = Math.max(0, diferencaDias(referenciaDia, hoje));

  // Sequência confirmada: de hoje (ou de ontem, se hoje ainda não foi marcado) para trás.
  let cursor = estadoDoDia(eventos, hoje) === "confirmado" ? hoje : somarDias(hoje, -1);
  let sequencia = 0;
  let inicioDaSequencia: string | null = null;
  while (cursor >= inicioDia && estadoDoDia(eventos, cursor) === "confirmado") {
    sequencia++;
    inicioDaSequencia = cursor;
    cursor = somarDias(cursor, -1);
  }

  // Dias sem informação desde a referência até ontem (hoje ainda pode ser marcado).
  let semInformacao = 0;
  const primeiro = ultimoEpisodio ? somarDias(ultimoEpisodio, 1) : inicioDia;
  for (let d = primeiro; d < hoje; d = somarDias(d, 1)) {
    if (estadoDoDia(eventos, d) === "sem_informacao") semInformacao++;
  }

  return {
    hoje,
    inicioDia,
    ultimoEpisodio,
    diasDesdeReferencia,
    referencia: ultimoEpisodio ? "episodio" : "inicio",
    sequenciaConfirmada: sequencia,
    inicioDaSequencia,
    diasSemInformacao: semInformacao,
    totalEpisodios: eventos.filter((e) => e.tipo === "episodio").length,
    totalVontades: eventos.filter((e) => e.tipo === "vontade").length,
    totalDiasConfirmados: new Set(eventos.filter((e) => e.tipo === "dia_sem").map((e) => e.dia)).size,
  };
}

/* ------------------------------ marcos ------------------------------------ */

export type SituacaoMarco =
  | { estado: "sustentado"; marco: Marco; titulo: string; texto: string }
  | { estado: "so-tempo"; marco: Marco; titulo: string; texto: string; diasSemInformacao: number }
  | { estado: "futuro"; marco: Marco; faltam: number };

/**
 * Cada marco aparece em uma de três formas:
 *  - sustentado: há `limiar` dias CONSECUTIVOS confirmados → título forte;
 *  - so-tempo:   passou o tempo desde a referência, mas faltam confirmações →
 *                título fraco, sem celebrar, dizendo quantos dias estão sem informação;
 *  - futuro:     ainda não chegou.
 */
export function situacaoDosMarcos(marcos: Marco[], r: ResumoEpisodios): SituacaoMarco[] {
  return marcos.map((marco) => {
    if (r.sequenciaConfirmada >= marco.limiar) {
      return { estado: "sustentado", marco, titulo: marco.titulo, texto: marco.texto };
    }
    if (r.diasDesdeReferencia >= marco.limiar) {
      return {
        estado: "so-tempo",
        marco,
        titulo: marco.tituloSemRegistro,
        texto: marco.textoSemRegistro,
        diasSemInformacao: r.diasSemInformacao,
      };
    }
    return { estado: "futuro", marco, faltam: marco.limiar - Math.max(r.sequenciaConfirmada, 0) };
  });
}

/* ------------------------------ frequência -------------------------------- */

export type Semana = {
  /** primeiro e último dia da janela de 7 dias */
  de: string;
  ate: string;
  episodios: number;
  vontades: number;
  diasConfirmados: number;
  diasSemInformacao: number;
};

/**
 * Frequência por janelas de 7 dias terminando hoje (a mais nova é a última).
 * Cada janela diz quantos dias estavam sem informação: uma semana com 1 episódio
 * e 5 dias sem registro NÃO é uma semana "boa" — é uma semana pouco registrada.
 */
export function frequenciaSemanal(eventos: EventoRegistro[], inicioDia: string, agora: number, tz: string, semanas = 4): Semana[] {
  const hoje = diaLocalDe(agora, tz);
  const saida: Semana[] = [];
  for (let i = semanas - 1; i >= 0; i--) {
    const ate = somarDias(hoje, -7 * i);
    const de = somarDias(ate, -6);
    let confirmados = 0;
    let sem = 0;
    for (let d = de; d <= ate; d = somarDias(d, 1)) {
      if (d < inicioDia) continue; // antes do início não existe
      const est = estadoDoDia(eventos, d);
      if (est === "confirmado") confirmados++;
      else if (est === "sem_informacao" && d < hoje) sem++;
    }
    const naJanela = eventos.filter((e) => e.dia >= de && e.dia <= ate);
    saida.push({
      de,
      ate,
      episodios: naJanela.filter((e) => e.tipo === "episodio").length,
      vontades: naJanela.filter((e) => e.tipo === "vontade").length,
      diasConfirmados: confirmados,
      diasSemInformacao: sem,
    });
  }
  return saida;
}

/** Contexto que mais aparece entre episódios e vontades — para a ação "registrar o gatilho". */
export function contextoMaisFrequente(eventos: EventoRegistro[]): { contexto: string; vezes: number } | null {
  const contagem = new Map<string, number>();
  for (const e of eventos) {
    if ((e.tipo === "episodio" || e.tipo === "vontade") && e.contexto) {
      contagem.set(e.contexto, (contagem.get(e.contexto) ?? 0) + 1);
    }
  }
  const [melhor] = [...contagem.entries()].sort((a, b) => b[1] - a[1]);
  return melhor ? { contexto: melhor[0], vezes: melhor[1] } : null;
}

/** Estratégias usadas, da mais citada à menos. */
export function estrategiasUsadas(eventos: EventoRegistro[]): { estrategia: string; vezes: number }[] {
  const contagem = new Map<string, number>();
  for (const e of eventos) {
    if (e.estrategia) contagem.set(e.estrategia, (contagem.get(e.estrategia) ?? 0) + 1);
  }
  return [...contagem.entries()].sort((a, b) => b[1] - a[1]).map(([estrategia, vezes]) => ({ estrategia, vezes }));
}

/* ----------------------------- validação ---------------------------------- */

export type EntradaEvento = {
  tipo: string;
  /** "YYYY-MM-DD"; sem isto vale hoje */
  dia?: string;
  intensidade?: number | null;
  contexto?: string | null;
  estrategia?: string | null;
  desconforto?: number | null;
  aparencia?: number | null;
  valor?: number | null;
  nota?: string | null;
};

export type EventoValido = {
  tipo: TipoEvento;
  dia: string;
  quando: Date;
  intensidade: number | null;
  contexto: string | null;
  estrategia: string | null;
  desconforto: number | null;
  aparencia: number | null;
  valor: number | null;
  nota: string | null;
};

type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string };

const escala = (v: number | null | undefined, nome: string): Resultado<number | null> => {
  if (v === null || v === undefined) return { ok: true, valor: null };
  if (!Number.isInteger(v) || v < 1 || v > 5) return { ok: false, erro: `${nome}: escolha de 1 a 5.` };
  return { ok: true, valor: v };
};

/**
 * Valida um registro. Datas passadas são aceitas (registrar depois é normal),
 * mas não anteriores ao início do acompanhamento nem futuras: o app não registra
 * o que ainda não aconteceu.
 */
export function validarEvento(
  e: EntradaEvento,
  inicioDia: string,
  agora: number,
  tz: string,
  tiposPermitidos: TipoEvento[] = ["episodio", "vontade", "dia_sem"]
): Resultado<EventoValido> {
  if (!tiposPermitidos.includes(e.tipo as TipoEvento)) {
    return { ok: false, erro: "Esse tipo de registro não existe para este acompanhamento." };
  }
  const tipo = e.tipo as TipoEvento;
  const hoje = diaLocalDe(agora, tz);
  const dia = e.dia ?? hoje;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || !instanteLocal(dia, tz)) {
    return { ok: false, erro: "Escolha uma data válida." };
  }
  if (dia > hoje) return { ok: false, erro: "Esse dia ainda não chegou." };
  if (dia < inicioDia) {
    return { ok: false, erro: "Essa data é anterior ao início do acompanhamento. Ajuste a data de início, se precisar." };
  }

  const contexto = e.contexto ? e.contexto : null;
  if (contexto && !(CONTEXTOS as readonly string[]).includes(contexto)) {
    return { ok: false, erro: "Escolha um contexto da lista." };
  }
  const estrategia = (e.estrategia ?? "").trim() || null;
  if (estrategia && estrategia.length > 80) return { ok: false, erro: "A estratégia aceita até 80 caracteres." };
  const nota = (e.nota ?? "").trim() || null;
  if (nota && nota.length > 300) return { ok: false, erro: "A nota aceita até 300 caracteres." };

  const intensidade = escala(e.intensidade, "Intensidade");
  if (!intensidade.ok) return intensidade;
  const desconforto = escala(e.desconforto, "Desconforto");
  if (!desconforto.ok) return desconforto;
  const aparencia = escala(e.aparencia, "Aparência");
  if (!aparencia.ok) return aparencia;

  let valor: number | null = null;
  if (e.valor !== null && e.valor !== undefined) {
    if (tipo !== "pratica") return { ok: false, erro: "Só registros de prática têm quantidade." };
    if (!Number.isFinite(e.valor) || e.valor < 0 || e.valor > 1440) return { ok: false, erro: "Quantidade fora do limite." };
    valor = e.valor;
  }

  // Hoje: o instante real. Dia passado: meio-dia local (a hora exata não importa e não é inventada).
  const quando = dia === hoje ? new Date(agora) : (instanteLocal(`${dia}T12:00`, tz) as Date);

  return {
    ok: true,
    valor: {
      tipo,
      dia,
      quando,
      intensidade: intensidade.valor,
      contexto,
      estrategia,
      desconforto: desconforto.valor,
      aparencia: aparencia.valor,
      valor,
      nota,
    },
  };
}

export { DIA_MS };
