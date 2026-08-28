import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";

export const runtime = "nodejs";

const Corpo = z.object({
  nome: z.string().trim().min(2).max(80).optional(),
  timezone: z.string().max(64).optional(),
  notifMarcos: z.boolean().optional(),
  notifResumoDiario: z.boolean().optional(),
  notifNoite: z.boolean().optional(),
  horaResumo: z.number().int().min(0).max(23).optional(),
  horaNoite: z.number().int().min(0).max(23).optional(),
});

export async function PATCH(req: Request) {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const dados = Corpo.safeParse(await req.json().catch(() => null));
  if (!dados.success) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: uid },
    data: dados.data,
    select: {
      id: true,
      nome: true,
      email: true,
      timezone: true,
      notifMarcos: true,
      notifResumoDiario: true,
      notifNoite: true,
      horaResumo: true,
      horaNoite: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}
