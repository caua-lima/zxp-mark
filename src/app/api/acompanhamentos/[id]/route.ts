import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sessaoValida } from "@/lib/auth";
import { fusoDoUsuario } from "@/lib/usuario";
import {
  arquivarAcompanhamento,
  editarAcompanhamento,
  excluirAcompanhamento,
  obterAcompanhamento,
} from "@/lib/servicos/acompanhamentos";

export const runtime = "nodejs";

const Patch = z.object({
  titulo: z.string().optional(),
  categoria: z.string().optional(),
  emoji: z.string().optional(),
  tom: z.string().optional(),
  descricao: z.string().nullable().optional(),
  inicio: z.string().optional(),
  /** true arquiva, false devolve para a lista principal */
  arquivado: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const uid = await sessaoValida();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const a = await obterAcompanhamento(prisma, uid, id);
  if (!a) return NextResponse.json({ erro: "Acompanhamento não encontrado." }, { status: 404 });
  return NextResponse.json({ acompanhamento: a });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const uid = await sessaoValida();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const corpo = Patch.safeParse(await req.json().catch(() => null));
  if (!corpo.success) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });

  const { id } = await ctx.params;
  const { arquivado, ...edicao } = corpo.data;

  const r = await editarAcompanhamento(prisma, uid, id, edicao, await fusoDoUsuario(uid));
  if (!r.ok) return NextResponse.json({ erro: r.erro }, { status: r.status });

  if (arquivado !== undefined) {
    const a = await arquivarAcompanhamento(prisma, uid, id, arquivado);
    if (!a.ok) return NextResponse.json({ erro: a.erro }, { status: a.status });
  }

  const atual = await obterAcompanhamento(prisma, uid, id);
  return NextResponse.json({ ok: true, acompanhamento: atual });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const uid = await sessaoValida();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const r = await excluirAcompanhamento(prisma, uid, id);
  if (!r.ok) return NextResponse.json({ erro: r.erro }, { status: r.status });
  return NextResponse.json({ ok: true });
}
