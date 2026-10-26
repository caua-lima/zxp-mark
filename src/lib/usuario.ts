import { prisma } from "@/lib/db";
import { fusoSeguro } from "@/lib/datas";

/**
 * Fuso do usuário logado. As rotas que recebem "relógio de parede" (sono,
 * início de um acompanhamento) precisam dele: o servidor roda em UTC, e
 * "23:00" digitado em São Paulo não é 23:00 UTC.
 */
export async function fusoDoUsuario(uid: string): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: uid }, select: { timezone: true } });
  return fusoSeguro(u?.timezone);
}
