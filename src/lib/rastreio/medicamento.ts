/**
 * Regras do acompanhamento de um tratamento medicamentoso.
 *
 * Isto é sobre REGISTRO. Nada aqui prescreve, calcula eficácia, estima quando o
 * efeito começa ou compensa dose esquecida. Quatro números, sempre separados:
 *
 *   1. dias desde o INÍCIO DO TRATAMENTO   — calendário, nunca zera
 *   2. dias desde o INÍCIO DA DOSE ATUAL   — muda quando a dose muda; o resto não
 *   3. dias CONSECUTIVOS com tomada confirmada — só conta dia com "tomou"
 *   4. TOTAL de dias registrados            — dias distintos com qualquer registro
 *
 * "Dia sem linha" significa SEM INFORMAÇÃO: não é "não tomou". A sequência
 * consecutiva é só uma organização do registro: nada no tratamento depende dela.
 *
 * Puro e sem alias.
 */
import { diaCalendario, diaLocalDe, diasCompletos, diferencaDias, instanteLocal } from "../datas.ts";
import type { Marco } from "../conhecimento/tipos.ts";
import { reconhecer, type Reconhecimento } from "../conhecimento/indice.ts";
import type { Tema } from "../conhecimento/tipos.ts";
import { somarDias } from "./episodios.ts";

export type EstadoTomada = "tomou" | "nao_tomou";

export type TomadaRegistro = { dia: string; estado: string; horario?: string | null; nota?: string | null };
export type DoseRegistro = { id?: string; descricao: string; mg?: number | null; desde: Date | string; nota?: string | null };
export type EfeitoRegistro = { dia: string; descricao: string; intensidade?: number | null };

export type ContagemDias = { completos: number; diaN: number };

export type ResumoTratamento = {
  hoje: string;
  inicioDia: string;
  /** 1. desde o início do tratamento */
  desdeInicio: ContagemDias;
  /** 2. desde o início da dose atual; null se nenhuma dose foi informada */
  doseAtual: { descricao: string; mg: number | null; desdeDia: string; contagem: ContagemDias } | null;
  /** 3. dias consecutivos com tomada confirmada, terminando hoje ou ontem */
  sequenciaConfirmada: number;
  inicioDaSequencia: string | null;
  /** 4. total de dias distintos com qualquer registro (tomou ou não tomou) */
  totalRegistrados: number;
  totalTomou: number;
  totalNaoTomou: number;
  /** dias entre o início e ontem sem nenhuma informação */
  diasSemInformacao: number;
  /** estado de hoje, ou null se ainda não há registro */
  hojeEstado: EstadoTomada | null;
};

/** Dose vigente: a de maior `desde` que já começou. Doses futuras ainda não valem. */
export function doseVigente<T extends DoseRegistro>(doses: T[], agora: number): T | null {
  const iniciadas = doses
    .filter((d) => new Date(d.desde).getTime() <= agora)
    .sort((a, b) => new Date(a.desde).getTime() - new Date(b.desde).getTime());
  return iniciadas.length ? iniciadas[iniciadas.length - 1] : null;
}

export function resumirTratamento(
  inicio: Date | string,
  doses: DoseRegistro[],
  tomadas: TomadaRegistro[],
  agora: number,
  tz: string
): ResumoTratamento {
  const hoje = diaLocalDe(agora, tz);
  const inicioDia = diaLocalDe(new Date(inicio), tz);
  const porDia = new Map<string, EstadoTomada>();
  for (const t of tomadas) {
    if (t.dia < inicioDia || t.dia > hoje) continue; // fora do período não conta
    if (t.estado === "tomou" || t.estado === "nao_tomou") porDia.set(t.dia, t.estado);
  }

  // Sequência: de hoje (se já registrado como "tomou") ou de ontem para trás.
  let cursor = porDia.get(hoje) === "tomou" ? hoje : somarDias(hoje, -1);
  let sequencia = 0;
  let inicioDaSequencia: string | null = null;
  while (cursor >= inicioDia && porDia.get(cursor) === "tomou") {
    sequencia++;
    inicioDaSequencia = cursor;
    cursor = somarDias(cursor, -1);
  }

  let semInformacao = 0;
  for (let d = inicioDia; d < hoje; d = somarDias(d, 1)) if (!porDia.has(d)) semInformacao++;

  const dose = doseVigente(doses, agora);
  return {
    hoje,
    inicioDia,
    desdeInicio: {
      completos: diasCompletos(new Date(inicio), agora),
      diaN: diaCalendario(new Date(inicio), agora, tz),
    },
    doseAtual: dose
      ? {
          descricao: dose.descricao,
          mg: dose.mg ?? null,
          desdeDia: diaLocalDe(new Date(dose.desde), tz),
          contagem: {
            completos: diasCompletos(new Date(dose.desde), agora),
            diaN: diaCalendario(new Date(dose.desde), agora, tz),
          },
        }
      : null,
    sequenciaConfirmada: sequencia,
    inicioDaSequencia,
    totalRegistrados: porDia.size,
    totalTomou: [...porDia.values()].filter((e) => e === "tomou").length,
    totalNaoTomou: [...porDia.values()].filter((e) => e === "nao_tomou").length,
    diasSemInformacao: semInformacao,
    hojeEstado: porDia.get(hoje) ?? null,
  };
}

/* ------------------------------- cartões ---------------------------------- */

export type SituacaoCartao =
  | { estado: "sustentado"; marco: Marco; titulo: string; texto: string }
  | { estado: "so-tempo"; marco: Marco; titulo: string; texto: string; diasSemInformacao: number }
  | { estado: "futuro"; marco: Marco; faltamDias: number };

/**
 * Cada cartão aparece em uma de três formas:
 *  - sustentado: há `limiar` dias CONSECUTIVOS com tomada confirmada → título forte;
 *  - so-tempo:   passaram `limiar` dias desde o início informado, mas a sequência
 *                não chega lá → título fraco, mostrando quantos dias estão sem informação;
 *  - futuro:     ainda não chegou — o conteúdo pode ser lido mesmo assim, o app não o tranca.
 *
 * A dose NÃO entra nessa conta: mudar de dose não reinicia nem recalcula nada.
 */
export function situacaoDosCartoes(marcos: Marco[], r: ResumoTratamento): SituacaoCartao[] {
  return marcos.map((marco) => {
    if (r.sequenciaConfirmada >= marco.limiar) {
      return { estado: "sustentado", marco, titulo: marco.titulo, texto: marco.texto };
    }
    if (r.desdeInicio.completos >= marco.limiar) {
      return {
        estado: "so-tempo",
        marco,
        titulo: marco.tituloSemRegistro,
        texto: marco.textoSemRegistro,
        diasSemInformacao: r.diasSemInformacao,
      };
    }
    return { estado: "futuro", marco, faltamDias: marco.limiar - r.desdeInicio.completos };
  });
}

/* ------------------------- identificar o medicamento ---------------------- */

export type Identificacao =
  /** reconhecido pelo nome exato: pode salvar */
  | { tipo: "confirmado"; medicamentoId: string; nome: string }
  /** parece erro de digitação: a pessoa PRECISA confirmar antes de salvar */
  | { tipo: "confirmar"; medicamentoId: string; sugestao: string; digitado: string }
  /** é outro medicamento (ex.: citalopram): não usar o conteúdo do escitalopram */
  | { tipo: "outro"; nome: string; naoE?: string }
  | { tipo: "vazio" };

/**
 * Antes de salvar, o app identifica o medicamento. Nome ambíguo nunca é salvo
 * como se fosse o da base; "citalopram" nunca vira "escitalopram".
 */
export function identificarMedicamento(digitado: string, temas: Tema[]): Identificacao {
  const nome = digitado.trim();
  if (nome.length < 2) return { tipo: "vazio" };
  const medicamentos = temas.filter((t) => t.categoria === "medicamento");
  const r: Reconhecimento = reconhecer(nome, medicamentos);
  if (r?.tipo === "exato") return { tipo: "confirmado", medicamentoId: r.tema.id, nome: r.tema.titulo };
  if (r?.tipo === "incerto") {
    return { tipo: "confirmar", medicamentoId: r.tema.id, sugestao: r.tema.titulo, digitado: r.digitado };
  }
  if (r?.tipo === "outro-medicamento") return { tipo: "outro", nome, naoE: r.naoE };
  return { tipo: "outro", nome };
}

/* ------------------------------- validação -------------------------------- */

type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string };

const HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validarHorario(h: string | null | undefined): Resultado<string | null> {
  const v = (h ?? "").trim();
  if (!v) return { ok: true, valor: null };
  return HORARIO.test(v) ? { ok: true, valor: v } : { ok: false, erro: "Use um horário no formato 08:30." };
}

function validarDiaNoPeriodo(dia: string | undefined, inicioDia: string, agora: number, tz: string): Resultado<string> {
  const hoje = diaLocalDe(agora, tz);
  const d = dia ?? hoje;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !instanteLocal(d, tz)) return { ok: false, erro: "Escolha uma data válida." };
  if (d > hoje) return { ok: false, erro: "Esse dia ainda não chegou." };
  if (d < inicioDia) {
    return { ok: false, erro: "Essa data é anterior ao início informado do tratamento. Ajuste a data de início, se precisar." };
  }
  return { ok: true, valor: d };
}

export type EntradaTomada = { dia?: string; estado: string; horario?: string | null; nota?: string | null };
export type TomadaValida = { dia: string; estado: EstadoTomada; horario: string | null; nota: string | null };

export function validarTomada(e: EntradaTomada, inicio: Date | string, agora: number, tz: string): Resultado<TomadaValida> {
  if (e.estado !== "tomou" && e.estado !== "nao_tomou") {
    return { ok: false, erro: "Escolha “tomei” ou “não tomei”." };
  }
  const dia = validarDiaNoPeriodo(e.dia, diaLocalDe(new Date(inicio), tz), agora, tz);
  if (!dia.ok) return dia;
  const horario = validarHorario(e.estado === "tomou" ? e.horario : null);
  if (!horario.ok) return horario;
  const nota = (e.nota ?? "").trim() || null;
  if (nota && nota.length > 300) return { ok: false, erro: "A observação aceita até 300 caracteres." };
  return { ok: true, valor: { dia: dia.valor, estado: e.estado, horario: horario.valor, nota } };
}

export type EntradaDose = { descricao: string; mg?: number | null; desde: string; nota?: string | null };
export type DoseValida = { descricao: string; mg: number | null; desde: Date; nota: string | null };

/**
 * Valida uma dose INFORMADA. O app não avalia a dose: aceita qualquer valor
 * positivo e plausível como número, porque quem a define é o médico.
 */
export function validarDose(e: EntradaDose, inicio: Date | string, agora: number, tz: string): Resultado<DoseValida> {
  const descricao = (e.descricao ?? "").trim();
  if (descricao.length < 1) return { ok: false, erro: "Informe a dose como está na sua prescrição (ex.: 10 mg)." };
  if (descricao.length > 40) return { ok: false, erro: "A dose aceita até 40 caracteres." };
  const mg = e.mg ?? null;
  if (mg !== null && (!Number.isFinite(mg) || mg <= 0 || mg > 1000)) return { ok: false, erro: "Informe a quantidade em mg, se quiser." };

  const dia = validarDiaNoPeriodo(e.desde, diaLocalDe(new Date(inicio), tz), agora, tz);
  if (!dia.ok) {
    return { ok: false, erro: dia.erro.replace("Essa data é anterior ao início informado do tratamento.", "A dose não pode começar antes do início informado do tratamento.") };
  }
  const nota = (e.nota ?? "").trim() || null;
  if (nota && nota.length > 300) return { ok: false, erro: "A observação aceita até 300 caracteres." };
  return { ok: true, valor: { descricao, mg, desde: instanteLocal(dia.valor, tz) as Date, nota } };
}

export type EntradaEfeito = { dia?: string; descricao: string; intensidade?: number | null; nota?: string | null };
export type EfeitoValido = { dia: string; quando: Date; descricao: string; intensidade: number | null; nota: string | null };

export function validarEfeito(e: EntradaEfeito, inicio: Date | string, agora: number, tz: string): Resultado<EfeitoValido> {
  const descricao = (e.descricao ?? "").trim();
  if (descricao.length < 2) return { ok: false, erro: "Descreva o que você notou." };
  if (descricao.length > 300) return { ok: false, erro: "A descrição aceita até 300 caracteres." };
  const intensidade = e.intensidade ?? null;
  if (intensidade !== null && ![1, 2, 3].includes(intensidade)) return { ok: false, erro: "Escolha leve, moderado ou forte." };
  const dia = validarDiaNoPeriodo(e.dia, diaLocalDe(new Date(inicio), tz), agora, tz);
  if (!dia.ok) return dia;
  const nota = (e.nota ?? "").trim() || null;
  if (nota && nota.length > 300) return { ok: false, erro: "A observação aceita até 300 caracteres." };
  const hoje = diaLocalDe(agora, tz);
  const quando = dia.valor === hoje ? new Date(agora) : (instanteLocal(`${dia.valor}T12:00`, tz) as Date);
  return { ok: true, valor: { dia: dia.valor, quando, descricao, intensidade, nota } };
}

/* ------------------------- resumo para a consulta -------------------------- */

export type DadosConsulta = {
  nome: string;
  inicio: Date | string;
  horario?: string | null;
  doses: DoseRegistro[];
  tomadas: TomadaRegistro[];
  efeitos: EfeitoRegistro[];
  agora: number;
  tz: string;
};

/**
 * Resumo para levar ao profissional. É SÓ o que a pessoa registrou, dito como
 * registro: sem interpretar, sem "melhora", sem concluir causa.
 */
export function montarResumoParaConsulta(d: DadosConsulta): string {
  const r = resumirTratamento(d.inicio, d.doses, d.tomadas, d.agora, d.tz);
  const fmt = (dia: string) => dia.split("-").reverse().join("/");
  const linhas: string[] = [];
  linhas.push(`Resumo do que eu registrei — ${d.nome}`);
  linhas.push(`Gerado em ${fmt(r.hoje)}. São registros feitos por mim no ZXP Mark; o app não os interpreta.`);
  linhas.push("");
  linhas.push(`Início do tratamento (informado por mim): ${fmt(r.inicioDia)} — ${r.desdeInicio.completos} dias completos desde então.`);
  if (d.horario) linhas.push(`Horário previsto informado: ${d.horario}.`);

  const doses = [...d.doses].sort((a, b) => new Date(a.desde).getTime() - new Date(b.desde).getTime());
  if (doses.length) {
    linhas.push("");
    linhas.push("Doses que informei (do histórico):");
    for (const x of doses) linhas.push(`- ${x.descricao}, desde ${fmt(diaLocalDe(new Date(x.desde), d.tz))}${x.nota ? ` (${x.nota})` : ""}`);
    if (r.doseAtual) linhas.push(`Dose atual informada: ${r.doseAtual.descricao}, há ${r.doseAtual.contagem.completos} dias completos.`);
  } else {
    linhas.push("Não informei doses.");
  }

  linhas.push("");
  linhas.push("Registro de tomadas:");
  linhas.push(`- Dias com registro: ${r.totalRegistrados} (tomou: ${r.totalTomou}; não tomou: ${r.totalNaoTomou}).`);
  linhas.push(`- Dias sem nenhuma informação desde o início: ${r.diasSemInformacao}. Dia sem registro não quer dizer que não tomei.`);
  linhas.push(`- Dias seguidos com tomada registrada até agora: ${r.sequenciaConfirmada}.`);

  if (d.efeitos.length) {
    linhas.push("");
    linhas.push("Efeitos que anotei:");
    const nivel = ["", "leve", "moderado", "forte"];
    for (const e of [...d.efeitos].sort((a, b) => a.dia.localeCompare(b.dia))) {
      linhas.push(`- ${fmt(e.dia)}: ${e.descricao}${e.intensidade ? ` (${nivel[e.intensidade]})` : ""}`);
    }
  } else {
    linhas.push("");
    linhas.push("Não anotei efeitos.");
  }
  linhas.push("");
  linhas.push("Perguntas que quero fazer:");
  linhas.push("- ");
  return linhas.join("\n");
}

export { diferencaDias };
