import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { iconePara } from "@/lib/deteccao";

export const runtime = "nodejs";

const Patch = z.object({
  titulo: z.string().trim().min(2).max(80).optional(),
  descricao: z.string().max(500).nullable().optional(),
  alvo: z.string().datetime({ offset: true }).optional(),
  avisoDiario: z.boolean().optional(),
  avisos: z.array(z.number().int().min(0).max(365)).max(12).optional(),
  notificar: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const atual = await prisma.contagem.findFirst({ where: { id, userId: uid } });
  if (!atual) return NextResponse.json({ erro: "Contagem não encontrada" }, { status: 404 });

  const dados = Patch.safeParse(await req.json().catch(() => null));
  if (!dados.success) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });

  const { alvo, avisos, ...resto } = dados.data;
  const patch: Record<string, unknown> = { ...resto };

  // Título ou descrição mudou: o ícone é derivado deles, então recalcula.
  if (dados.data.titulo !== undefined || dados.data.descricao !== undefined) {
    patch.emoji = iconePara(
      dados.data.titulo ?? atual.titulo,
      dados.data.descricao !== undefined ? dados.data.descricao : atual.descricao
    );
  }

  if (alvo) {
    patch.alvo = new Date(alvo);
    // Data nova = ciclo novo: libera os avisos para serem enviados de novo.
    await prisma.enviada.deleteMany({ where: { refId: id, ciclo: atual.alvo } });
  }
  if (avisos) patch.avisos = [...new Set(avisos)].sort((a, b) => b - a);

  const contagem = await prisma.contagem.update({ where: { id }, data: patch });
  return NextResponse.json({ ok: true, contagem });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const atual = await prisma.contagem.findFirst({ where: { id, userId: uid } });
  if (!atual) return NextResponse.json({ erro: "Contagem não encontrada" }, { status: 404 });

  await prisma.contagem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
