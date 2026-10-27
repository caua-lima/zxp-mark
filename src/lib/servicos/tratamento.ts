/**
 * Persistência do acompanhamento de medicamento.
 *
 * Mesma disciplina dos outros serviços: toda consulta filtra por `userId`,
 * atualizar/apagar usam `updateMany`/`deleteMany` com o dono no `where`, e "não é
 * seu" e "não existe" devolvem a mesma resposta.
 *
 * O que este arquivo garante, além disso:
 *  - o nome do medicamento é IDENTIFICADO antes de salvar; um erro de digitação só
 *    salva depois de a pessoa confirmar, e "citalopram" nunca vira escitalopram;
 *  - trocar de dose ACRESCENTA uma linha: nada é apagado e nada recomeça;
 *  - há no máximo uma informação por dia de tomada (editar não duplica), e apagar
 *    o registro de um dia o devolve a "sem informação".
 */
import type { PrismaClient } from "@prisma/client";
import { TEMAS, temaPorId } from "../conhecimento/catalogo.ts";
import { diaLocalDe, instanteLocal } from "../datas.ts";
import {
  identificarMedicamento,
  montarResumoParaConsulta,
  resumirTratamento,
  situacaoDosCartoes,
  validarDose,
  validarEfeito,
  validarHorario,
  validarTomada,
  type EntradaDose,
  type EntradaEfeito,
  type EntradaTomada,
} from "../rastreio/medicamento.ts";
import { falha, naoEncontrado, ok } from "./comum.ts";

export type Db = Pick<PrismaClient, "tratamento" | "doseTratamento" | "tomadaDia" | "efeitoRegistrado">;

export const LIMITE_TRATAMENTOS = 10;

export type EntradaTratamento = {
  /** como a pessoa digitou */
  nome: string;
  /** a pessoa confirmou a sugestão de nome que o app fez */
  confirmouSugestao?: boolean;
  /** "YYYY-MM-DD": início do TRATAMENTO */
  inicio: string;
  /** "HH:mm", conforme a prescrição que a pessoa informou */
  horario?: string | null;
  /** dose atual, se quiser informar; `desde` é o início DA DOSE e pode ser diferente do tratamento */
  dose?: { descricao: string; mg?: number | null; desde?: string; nota?: string | null };
};

export async function criarTratamento(db: Db, uid: string, e: EntradaTratamento, tz: string, agora: number = Date.now()) {
  const id = identificarMedicamento(e.nome ?? "", TEMAS);
  if (id.tipo === "vazio") return falha("Informe o nome do medicamento.");

  let medicamentoId: string;
  let nome: string;
  if (id.tipo === "confirmado") {
    medicamentoId = id.medicamentoId;
    nome = id.nome;
  } else if (id.tipo === "confirmar") {
    // Nome ambíguo NUNCA é salvo como se fosse o da base sem a pessoa confirmar.
    if (!e.confirmouSugestao) {
      return falha(`Você quis dizer “${id.sugestao}”? Confirme para salvar com esse nome.`, 409);
    }
    medicamentoId = id.medicamentoId;
    nome = id.sugestao;
  } else {
    medicamentoId = "outro";
    nome = id.nome.trim();
    if (nome.length > 60) return falha("O nome aceita até 60 caracteres.");
  }

  const hoje = diaLocalDe(agora, tz);
  const inicio = instanteLocal(e.inicio ?? "", tz);
  if (!inicio) return falha("Escolha uma data de início válida.");
  if (e.inicio > hoje) return falha("A data de início ainda não chegou.");
  if (e.inicio < "1990-01-01") return falha("Essa data está muito distante. Confira o ano.");

  const horario = validarHorario(e.horario);
  if (!horario.ok) return falha(horario.erro);

  if ((await db.tratamento.count({ where: { userId: uid } })) >= LIMITE_TRATAMENTOS) {
    return falha(`Limite de ${LIMITE_TRATAMENTOS} acompanhamentos de medicamento.`);
  }

  // Valida a dose ANTES de criar qualquer coisa: dose inválida não deixa tratamento pela metade.
  let dose: ReturnType<typeof validarDose> | null = null;
  if (e.dose) {
    dose = validarDose({ ...e.dose, desde: e.dose.desde ?? e.inicio }, inicio, agora, tz);
    if (!dose.ok) return falha(dose.erro);
  }

  const tratamento = await db.tratamento.create({
    data: { userId: uid, medicamentoId, nome, inicio, horario: horario.valor },
  });
  if (dose?.ok) {
    await db.doseTratamento.create({ data: { tratamentoId: tratamento.id, userId: uid, ...dose.valor } });
  }
  return ok(tratamento);
}

export async function obterTratamento(db: Db, uid: string, id: string) {
  return db.tratamento.findFirst({ where: { id, userId: uid } });
}

export async function listarTratamentos(db: Db, uid: string, arquivados = false) {
  return db.tratamento.findMany({
    where: { userId: uid, arquivadoEm: arquivados ? { not: null } : null },
    orderBy: { criadoEm: "asc" },
  });
}

export async function atualizarTratamento(
  db: Db,
  uid: string,
  id: string,
  e: { horario?: string | null; lembrete?: boolean; lembreteDetalhado?: boolean }
) {
  const atual = await obterTratamento(db, uid, id);
  if (!atual) return naoEncontrado("Acompanhamento");

  const data: Record<string, unknown> = {};
  let horario = atual.horario;
  if (e.horario !== undefined) {
    const h = validarHorario(e.horario);
    if (!h.ok) return falha(h.erro);
    data.horario = h.valor;
    horario = h.valor;
  }
  if (e.lembrete !== undefined) {
    if (e.lembrete && !horario) return falha("Para ligar o lembrete, informe o horário previsto.");
    data.lembrete = e.lembrete;
    // Desligar o lembrete desliga também o texto detalhado.
    if (!e.lembrete) data.lembreteDetalhado = false;
  }
  if (e.lembreteDetalhado !== undefined && e.lembrete !== false) {
    if (e.lembreteDetalhado && !(e.lembrete ?? atual.lembrete)) return falha("Ligue o lembrete antes de escolher o texto.");
    data.lembreteDetalhado = e.lembreteDetalhado;
  }
  if (Object.keys(data).length === 0) return ok(atual);
  const r = await db.tratamento.updateMany({ where: { id, userId: uid }, data });
  return r.count === 0 ? naoEncontrado("Acompanhamento") : ok(null);
}

export async function arquivarTratamento(db: Db, uid: string, id: string, arquivado: boolean, agora: number = Date.now()) {
  const r = await db.tratamento.updateMany({ where: { id, userId: uid }, data: { arquivadoEm: arquivado ? new Date(agora) : null, ...(arquivado ? { lembrete: false, lembreteDetalhado: false } : {}) } });
  return r.count === 0 ? naoEncontrado("Acompanhamento") : ok(null);
}

/** Apaga o acompanhamento e TUDO que pende dele: tomadas, doses e efeitos. */
export async function excluirTratamento(db: Db, uid: string, id: string) {
  const r = await db.tratamento.deleteMany({ where: { id, userId: uid } });
  return r.count === 0 ? naoEncontrado("Acompanhamento") : ok(null);
}

/* -------------------------------- tomadas ---------------------------------- */

export async function registrarTomada(db: Db, uid: string, tratamentoId: string, e: EntradaTomada, tz: string, agora: number = Date.now()) {
  const t = await db.tratamento.findFirst({ where: { id: tratamentoId, userId: uid, arquivadoEm: null } });
  if (!t) return naoEncontrado("Acompanhamento");
  const v = validarTomada(e, t.inicio, agora, tz);
  if (!v.ok) return falha(v.erro);

  const existente = await db.tomadaDia.findFirst({ where: { tratamentoId, userId: uid, dia: v.valor.dia } });
  const dados = { estado: v.valor.estado, horario: v.valor.horario, nota: v.valor.nota };

  if (existente) {
    await db.tomadaDia.updateMany({ where: { id: existente.id, userId: uid }, data: dados });
    return ok({ dia: v.valor.dia, criada: false });
  }
  try {
    await db.tomadaDia.create({ data: { tratamentoId, userId: uid, dia: v.valor.dia, ...dados } });
  } catch (erro) {
    // Duas requisições do mesmo dia ao mesmo tempo: a segunda bate no índice único e vira edição.
    if ((erro as { code?: string }).code !== "P2002") throw erro;
    await db.tomadaDia.updateMany({ where: { tratamentoId, userId: uid, dia: v.valor.dia }, data: dados });
    return ok({ dia: v.valor.dia, criada: false });
  }
  return ok({ dia: v.valor.dia, criada: true });
}

/** Apagar o registro de um dia o devolve a "sem informação" (não a "não tomou"). */
export async function removerTomada(db: Db, uid: string, tratamentoId: string, dia: string) {
  const r = await db.tomadaDia.deleteMany({ where: { tratamentoId, userId: uid, dia } });
  return r.count === 0 ? naoEncontrado("Registro") : ok(null);
}

/* --------------------------------- doses ----------------------------------- */

/**
 * Informa uma dose. Acrescenta ao histórico; NÃO altera o início do tratamento, as
 * tomadas, a sequência nem os cartões — e o app não calcula nenhuma previsão nova.
 */
export async function registrarDose(db: Db, uid: string, tratamentoId: string, e: EntradaDose, tz: string, agora: number = Date.now()) {
  const t = await db.tratamento.findFirst({ where: { id: tratamentoId, userId: uid, arquivadoEm: null } });
  if (!t) return naoEncontrado("Acompanhamento");
  const v = validarDose(e, t.inicio, agora, tz);
  if (!v.ok) return falha(v.erro);

  const iguais = await db.doseTratamento.findMany({ where: { tratamentoId, userId: uid, desde: v.valor.desde } });
  const repetida = iguais.find((d) => d.descricao === v.valor.descricao);
  if (repetida) return ok({ dose: repetida, repetida: true });

  const dose = await db.doseTratamento.create({ data: { tratamentoId, userId: uid, ...v.valor } });
  return ok({ dose, repetida: false });
}

export async function removerDose(db: Db, uid: string, id: string) {
  const r = await db.doseTratamento.deleteMany({ where: { id, userId: uid } });
  return r.count === 0 ? naoEncontrado("Dose") : ok(null);
}

/* -------------------------------- efeitos ---------------------------------- */

export async function registrarEfeito(db: Db, uid: string, tratamentoId: string, e: EntradaEfeito, tz: string, agora: number = Date.now()) {
  const t = await db.tratamento.findFirst({ where: { id: tratamentoId, userId: uid, arquivadoEm: null } });
  if (!t) return naoEncontrado("Acompanhamento");
  const v = validarEfeito(e, t.inicio, agora, tz);
  if (!v.ok) return falha(v.erro);
  const efeito = await db.efeitoRegistrado.create({ data: { tratamentoId, userId: uid, ...v.valor } });
  return ok(efeito);
}

export async function removerEfeito(db: Db, uid: string, id: string) {
  const r = await db.efeitoRegistrado.deleteMany({ where: { id, userId: uid } });
  return r.count === 0 ? naoEncontrado("Registro") : ok(null);
}

/* --------------------------------- leitura --------------------------------- */

export async function carregarTratamento(db: Db, uid: string, id: string, tz: string, agora: number = Date.now()) {
  const tratamento = await obterTratamento(db, uid, id);
  if (!tratamento) return null;

  const [doses, tomadas, efeitos] = await Promise.all([
    db.doseTratamento.findMany({ where: { tratamentoId: id, userId: uid }, orderBy: { desde: "asc" } }),
    db.tomadaDia.findMany({ where: { tratamentoId: id, userId: uid }, orderBy: { dia: "desc" }, take: 800 }),
    db.efeitoRegistrado.findMany({ where: { tratamentoId: id, userId: uid }, orderBy: { quando: "desc" }, take: 200 }),
  ]);

  const resumo = resumirTratamento(tratamento.inicio, doses, tomadas, agora, tz);
  const tema = temaPorId(tratamento.medicamentoId);
  return {
    tratamento,
    doses,
    tomadas,
    efeitos,
    resumo,
    tema: tema?.categoria === "medicamento" ? tema : null,
    cartoes: tema?.categoria === "medicamento" ? situacaoDosCartoes(tema.marcos, resumo) : [],
    resumoParaConsulta: montarResumoParaConsulta({
      nome: tratamento.nome,
      inicio: tratamento.inicio,
      horario: tratamento.horario,
      doses,
      tomadas,
      efeitos,
      agora,
      tz,
    }),
  };
}

export type TratamentoCarregado = NonNullable<Awaited<ReturnType<typeof carregarTratamento>>>;
