/**
 * Persistência dos acompanhamentos (contagem crescente).
 *
 * Cada função recebe o cliente do banco e o id do usuário logado, e TODA
 * consulta filtra por esse id. Atualizar e apagar usam `updateMany`/`deleteMany`
 * com o dono na cláusula `where`, então não existe janela entre "conferir de
 * quem é" e "mexer": se o registro é de outra pessoa, simplesmente nada casa.
 * O mesmo vale para "não existe" — de fora, os dois casos são um 404 idêntico,
 * para ninguém descobrir ids alheios por tentativa.
 */
import type { PrismaClient } from "@prisma/client";
import {
  LIMITE_ACOMPANHAMENTOS,
  interpretarEdicao,
  interpretarNovo,
  type EntradaAcompanhamento,
} from "../acompanhamento.ts";

export type Db = Pick<PrismaClient, "acompanhamento">;

export type Falha = { ok: false; erro: string; status: number };
export type Sucesso<T> = { ok: true; valor: T };
export type Saida<T> = Sucesso<T> | Falha;

const NAO_ENCONTRADO: Falha = { ok: false, erro: "Acompanhamento não encontrado.", status: 404 };

export async function criarAcompanhamento(
  db: Db,
  uid: string,
  entrada: EntradaAcompanhamento,
  tz: string,
  agora: number = Date.now()
) {
  const dados = interpretarNovo(entrada, tz, agora);
  if (!dados.ok) return { ok: false, erro: dados.erro, status: 400 } satisfies Falha;

  const total = await db.acompanhamento.count({ where: { userId: uid } });
  if (total >= LIMITE_ACOMPANHAMENTOS) {
    return {
      ok: false,
      erro: `Limite de ${LIMITE_ACOMPANHAMENTOS} acompanhamentos. Apague algum que não precisa mais.`,
      status: 400,
    } satisfies Falha;
  }

  const criado = await db.acompanhamento.create({ data: { userId: uid, ...dados.valor } });
  return { ok: true, valor: criado } as const;
}

export async function listarAcompanhamentos(
  db: Db,
  uid: string,
  { arquivados }: { arquivados: boolean }
) {
  return db.acompanhamento.findMany({
    where: { userId: uid, arquivadoEm: arquivados ? { not: null } : null },
    // O mais antigo primeiro: é quem tem mais história para mostrar.
    orderBy: arquivados ? { arquivadoEm: "desc" } : { inicio: "asc" },
  });
}

export async function obterAcompanhamento(db: Db, uid: string, id: string) {
  return db.acompanhamento.findFirst({ where: { id, userId: uid } });
}

export async function editarAcompanhamento(
  db: Db,
  uid: string,
  id: string,
  entrada: EntradaAcompanhamento,
  tz: string,
  agora: number = Date.now()
): Promise<Saida<NonNullable<Awaited<ReturnType<typeof obterAcompanhamento>>>>> {
  const dados = interpretarEdicao(entrada, tz, agora);
  if (!dados.ok) return { ok: false, erro: dados.erro, status: 400 };

  if (Object.keys(dados.valor).length > 0) {
    const r = await db.acompanhamento.updateMany({ where: { id, userId: uid }, data: dados.valor });
    if (r.count === 0) return NAO_ENCONTRADO;
  }
  const atual = await obterAcompanhamento(db, uid, id);
  return atual ? { ok: true, valor: atual } : NAO_ENCONTRADO;
}

/** Arquivar tira da lista principal e guarda o histórico; desarquivar devolve. */
export async function arquivarAcompanhamento(
  db: Db,
  uid: string,
  id: string,
  arquivado: boolean,
  agora: number = Date.now()
): Promise<Saida<{ arquivadoEm: Date | null }>> {
  const arquivadoEm = arquivado ? new Date(agora) : null;
  const r = await db.acompanhamento.updateMany({ where: { id, userId: uid }, data: { arquivadoEm } });
  return r.count === 0 ? NAO_ENCONTRADO : { ok: true, valor: { arquivadoEm } };
}

export async function excluirAcompanhamento(
  db: Db,
  uid: string,
  id: string
): Promise<Saida<null>> {
  const r = await db.acompanhamento.deleteMany({ where: { id, userId: uid } });
  return r.count === 0 ? NAO_ENCONTRADO : { ok: true, valor: null };
}
