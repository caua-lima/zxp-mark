import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sessaoValida } from "@/lib/auth";
import { fusoDoUsuario } from "@/lib/usuario";
import { editarSono, excluirSono } from "@/lib/servicos/sono";

export const runtime = "nodejs";

const Corpo = z.object({
  dormiuEm: z.string(),
  acordouEm: z.string(),
  qualidade: z.number(),
  nota: z.string().nullable().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const uid = await sessaoValida();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const corpo = Corpo.safeParse(await req.json().catch(() => null));
  if (!corpo.success) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });

  const { id } = await ctx.params;
  const r = await editarSono(prisma, uid, id, corpo.data, await fusoDoUsuario(uid));
  if (!r.ok) return NextResponse.json({ erro: r.erro }, { status: r.status });
  return NextResponse.json({ ok: true, sono: r.valor });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const uid = await sessaoValida();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const r = await excluirSono(prisma, uid, id);
  if (!r.ok) return NextResponse.json({ erro: r.erro }, { status: r.status });
  return NextResponse.json({ ok: true });
}
