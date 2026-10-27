/**
 * Persistência do acompanhamento de hábito por registros (roer unhas e afins).
 *
 * Toda consulta filtra por `userId`; atualizar e apagar usam `updateMany` /
 * `deleteMany` com o dono no `where`, sem janela entre conferir e agir.
 * Idempotência por construção: iniciar duas vezes, ou confirmar o mesmo dia
 * duas vezes (toque duplo), não cria nada novo.
 */
import type { PrismaClient } from "@prisma/client";
import { temaPorId } from "../conhecimento/catalogo.ts";
import type { Tema } from "../conhecimento/tipos.ts";
import { diaLocalDe } from "../datas.ts";
import {
  contextoMaisFrequente,
  estrategiasUsadas,
  frequenciaSemanal,
  resumir,
  situacaoDosMarcos,
  validarEvento,
  type EntradaEvento,
  type TipoEvento,
} from "../rastreio/episodios.ts";
import { ehViolacaoDeUnico, falha, naoEncontrado, ok, type Saida } from "./comum.ts";

export type Db = Pick<PrismaClient, "habitoAcompanhado" | "eventoHabito">;

function temaRastreavel(temaId: string): Saida<Tema> {
  const tema = temaPorId(temaId);
  if (!tema) return naoEncontrado("Tema");
  if (tema.rastreio.tipo !== "episodios" && tema.rastreio.tipo !== "pratica") {
    return falha("Este tema não tem acompanhamento por registros.");
  }
  return ok(tema);
}

function tiposPermitidos(tema: Tema): TipoEvento[] {
  return tema.rastreio.tipo === "episodios" ? ["episodio", "vontade", "dia_sem"] : ["pratica"];
}

export type EntradaHabito = { temaId: string; objetivo?: string | null; metaSemanal?: number | null };

export async function iniciarHabito(db: Db, uid: string, e: EntradaHabito, agora: number = Date.now()) {
  const t = temaRastreavel(e.temaId);
  if (!t.ok) return t;

  const objetivo = (e.objetivo ?? "").trim() || null;
  if (objetivo && objetivo.length > 300) return falha("O objetivo aceita até 300 caracteres.");
  const meta = e.metaSemanal ?? null;
  if (meta !== null && (!Number.isFinite(meta) || meta < 0 || meta > 10_000)) return falha("Meta fora do limite.");

  const existente = await db.habitoAcompanhado.findFirst({ where: { userId: uid, temaId: e.temaId } });
  if (existente) {
    // Já existe: iniciar de novo só desarquiva e atualiza o que a pessoa mandou. Nada duplica.
    const atualizado = await db.habitoAcompanhado.update({
      where: { id: existente.id },
      data: {
        arquivadoEm: null,
        ...(e.objetivo !== undefined ? { objetivo } : {}),
        ...(e.metaSemanal !== undefined ? { metaSemanal: meta } : {}),
      },
    });
    return ok(atualizado);
  }

  try {
    const criado = await db.habitoAcompanhado.create({
      data: { userId: uid, temaId: e.temaId, inicio: new Date(agora), objetivo, metaSemanal: meta },
    });
    return ok(criado);
  } catch (erro) {
    // Duas requisições iguais ao mesmo tempo: a segunda bate no índice único e devolve a primeira.
    if (!ehViolacaoDeUnico(erro)) throw erro;
    const outro = await db.habitoAcompanhado.findFirst({ where: { userId: uid, temaId: e.temaId } });
    return outro ? ok(outro) : falha("Não consegui iniciar o acompanhamento.", 500);
  }
}

export async function arquivarHabito(db: Db, uid: string, temaId: string, arquivado: boolean, agora: number = Date.now()) {
  const r = await db.habitoAcompanhado.updateMany({
    where: { userId: uid, temaId },
    data: { arquivadoEm: arquivado ? new Date(agora) : null },
  });
  return r.count === 0 ? naoEncontrado("Acompanhamento") : ok(null);
}

/** Apaga o acompanhamento e todos os registros dele ("remover informações pessoais"). */
export async function excluirHabito(db: Db, uid: string, temaId: string) {
  const r = await db.habitoAcompanhado.deleteMany({ where: { userId: uid, temaId } });
  return r.count === 0 ? naoEncontrado("Acompanhamento") : ok(null);
}

export async function atualizarHabito(
  db: Db,
  uid: string,
  temaId: string,
  e: { objetivo?: string | null; metaSemanal?: number | null }
) {
  const data: Record<string, unknown> = {};
  if (e.objetivo !== undefined) {
    const o = (e.objetivo ?? "").trim() || null;
    if (o && o.length > 300) return falha("O objetivo aceita até 300 caracteres.");
    data.objetivo = o;
  }
  if (e.metaSemanal !== undefined) {
    if (e.metaSemanal !== null && (!Number.isFinite(e.metaSemanal) || e.metaSemanal < 0 || e.metaSemanal > 10_000)) {
      return falha("Meta fora do limite.");
    }
    data.metaSemanal = e.metaSemanal;
  }
  const r = await db.habitoAcompanhado.updateMany({ where: { userId: uid, temaId }, data });
  return r.count === 0 ? naoEncontrado("Acompanhamento") : ok(null);
}

/* -------------------------------- eventos --------------------------------- */

export async function registrarEvento(
  db: Db,
  uid: string,
  temaId: string,
  entrada: EntradaEvento,
  tz: string,
  agora: number = Date.now()
) {
  const t = temaRastreavel(temaId);
  if (!t.ok) return t;

  const habito = await db.habitoAcompanhado.findFirst({ where: { userId: uid, temaId, arquivadoEm: null } });
  if (!habito) return naoEncontrado("Acompanhamento");

  const v = validarEvento(entrada, diaLocalDe(habito.inicio, tz), agora, tz, tiposPermitidos(t.valor));
  if (!v.ok) return falha(v.erro);
  const ev = v.valor;

  if (ev.tipo === "dia_sem") {
    const doDia = await db.eventoHabito.findMany({ where: { habitoId: habito.id, userId: uid, dia: ev.dia } });
    if (doDia.some((x) => x.tipo === "episodio")) {
      return falha("Você registrou um episódio nesse dia. Para marcar “não roí”, apague o episódio.", 409);
    }
    const ja = doDia.find((x) => x.tipo === "dia_sem");
    if (ja) return ok({ evento: ja, repetido: true });
  }

  if (ev.tipo === "episodio") {
    // Um episódio contradiz a confirmação do mesmo dia: a confirmação sai, o episódio fica.
    await db.eventoHabito.deleteMany({ where: { habitoId: habito.id, userId: uid, dia: ev.dia, tipo: "dia_sem" } });
  }

  const criado = await db.eventoHabito.create({ data: { habitoId: habito.id, userId: uid, ...ev } });
  return ok({ evento: criado, repetido: false });
}

export async function removerEvento(db: Db, uid: string, id: string) {
  const r = await db.eventoHabito.deleteMany({ where: { id, userId: uid } });
  return r.count === 0 ? naoEncontrado("Registro") : ok(null);
}

export type EdicaoEvento = Pick<EntradaEvento, "intensidade" | "contexto" | "estrategia" | "desconforto" | "aparencia" | "nota" | "valor">;

export async function editarEvento(db: Db, uid: string, id: string, edicao: EdicaoEvento, tz: string, agora: number = Date.now()) {
  const atual = await db.eventoHabito.findFirst({ where: { id, userId: uid } });
  if (!atual) return naoEncontrado("Registro");
  const habito = await db.habitoAcompanhado.findFirst({ where: { id: atual.habitoId, userId: uid } });
  if (!habito) return naoEncontrado("Registro");

  // Reaproveita a validação completa com os valores já salvos + as mudanças.
  const v = validarEvento(
    {
      tipo: atual.tipo,
      dia: atual.dia,
      intensidade: edicao.intensidade !== undefined ? edicao.intensidade : atual.intensidade,
      contexto: edicao.contexto !== undefined ? edicao.contexto : atual.contexto,
      estrategia: edicao.estrategia !== undefined ? edicao.estrategia : atual.estrategia,
      desconforto: edicao.desconforto !== undefined ? edicao.desconforto : atual.desconforto,
      aparencia: edicao.aparencia !== undefined ? edicao.aparencia : atual.aparencia,
      valor: edicao.valor !== undefined ? edicao.valor : atual.valor,
      nota: edicao.nota !== undefined ? edicao.nota : atual.nota,
    },
    diaLocalDe(habito.inicio, tz),
    agora,
    tz,
    ["episodio", "vontade", "dia_sem", "pratica"]
  );
  if (!v.ok) return falha(v.erro);

  const { tipo: _t, dia: _d, quando: _q, ...campos } = v.valor;
  void _t; void _d; void _q;
  const r = await db.eventoHabito.updateMany({ where: { id, userId: uid }, data: campos });
  return r.count === 0 ? naoEncontrado("Registro") : ok(null);
}

/* --------------------------------- leitura -------------------------------- */

export async function carregarRastreio(db: Db, uid: string, temaId: string, tz: string, agora: number = Date.now()) {
  const tema = temaPorId(temaId);
  if (!tema) return null;
  const habito = await db.habitoAcompanhado.findFirst({ where: { userId: uid, temaId } });
  if (!habito) return null;

  const eventos = await db.eventoHabito.findMany({
    where: { habitoId: habito.id, userId: uid },
    orderBy: { quando: "desc" },
    take: 500,
  });

  const inicioDia = diaLocalDe(habito.inicio, tz);
  const resumo = resumir(eventos, inicioDia, agora, tz);
  return {
    habito,
    eventos,
    resumo,
    marcos: tema.rastreio.tipo === "episodios" ? situacaoDosMarcos(tema.marcos, resumo) : [],
    semanas: frequenciaSemanal(eventos, inicioDia, agora, tz, 4),
    contextoMaisFrequente: contextoMaisFrequente(eventos),
    estrategias: estrategiasUsadas(eventos),
  };
}

export type RastreioCarregado = NonNullable<Awaited<ReturnType<typeof carregarRastreio>>>;
