import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";

export type Guarda =
  | { ok: true; id: string }
  | { ok: false; status: 401 | 403; erro: string };

/** Exige sessão válida de um usuário com a flag de admin. */
export async function exigirAdmin(): Promise<Guarda> {
  const id = await usuarioId();
  if (!id) return { ok: false, status: 401, erro: "Não autenticado" };

  const u = await prisma.user.findUnique({ where: { id }, select: { admin: true } });
  if (!u?.admin) {
    return { ok: false, status: 403, erro: "Só administradores podem gerenciar acessos." };
  }
  return { ok: true, id };
}

/** Quantos admins existem — usado para nunca deixar o app sem nenhum. */
export function contarAdmins() {
  return prisma.user.count({ where: { admin: true } });
}
