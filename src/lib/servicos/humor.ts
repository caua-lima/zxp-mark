/**
 * Persistência do "como estou": um registro por dia, editável e removível.
 * Mesma disciplina: filtro por dono em tudo; unicidade (userId, dia) evita duplicata.
 */
import type { PrismaClient } from "@prisma/client";
import { validarHumor, type EntradaHumor } from "../rastreio/humor.ts";
import { falha, naoEncontrado, ok } from "./comum.ts";

export type Db = Pick<PrismaClient, "registroHumor">;

export async function registrarHumor(db: Db, uid: string, e: EntradaHumor, tz: string, agora: number = Date.now()) {
  const v = validarHumor(e, agora, tz);
  if (!v.ok) return falha(v.erro);
  const { dia, ...dados } = v.valor;

  // upsert pela chave única (userId, dia): registrar de novo no mesmo dia EDITA.
  const r = await db.registroHumor.upsert({
    where: { userId_dia: { userId: uid, dia } },
    create: { userId: uid, dia, ...dados },
    update: dados,
  });
  return ok(r);
}

export async function removerHumor(db: Db, uid: string, dia: string) {
  const r = await db.registroHumor.deleteMany({ where: { userId: uid, dia } });
  return r.count === 0 ? naoEncontrado("Registro") : ok(null);
}

export async function listarHumor(db: Db, uid: string, desdeDia?: string, limite = 400) {
  return db.registroHumor.findMany({
    where: { userId: uid, ...(desdeDia ? { dia: { gte: desdeDia } } : {}) },
    orderBy: { dia: "desc" },
    take: limite,
  });
}
