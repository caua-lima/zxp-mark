import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";

export const runtime = "nodejs";

const Patch = z.object({
  titulo: z.string().trim().min(2).max(80).optional(),
  emoji: z.string().max(8).optional(),
  porque: z.string().max(2000).nullable().optional(),
  unidadesPorDia: z.number().min(0).max(1000).nullable().optional(),
  gastoDiario: z.number().min(0).max(100000).nullable().optional(),
  ativo: z.boolean().optional(),
  /** corrige a data de início da sequência atual */
  cicloInicio: z.string().datetime().optional(),
});

async function meu(id: string, uid: string) {
  return prisma.marco.findFirst({ where: { id, userId: uid, arquivadoEm: null } });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const atual = await meu(id, uid);
  if (!atual) return NextResponse.json({ erro: "Marco não encontrado" }, { status: 404 });

  const dados = Patch.safeParse(await req.json().catch(() => null));
  if (!dados.success) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });

  const { cicloInicio, ...resto } = dados.data;
  const patch: Record<string, unknown> = { ...resto };

  if (cicloInicio) {
    const d = new Date(cicloInicio);
    if (d.getTime() > Date.now() + 60_000) {
      return NextResponse.json({ erro: "A data não pode ser no futuro." }, { status: 400 });
    }
    patch.cicloInicio = d;
    if (d < atual.inicio) patch.inicio = d;
    // Ao mudar a data de início, os marcos do ciclo antigo perdem validade.
    await prisma.enviada.deleteMany({ where: { refId: id, ciclo: atual.cicloInicio } });
  }

  const marco = await prisma.marco.update({ where: { id }, data: patch });
  return NextResponse.json({ ok: true, marco: { ...marco, melhorMs: Number(marco.melhorMs) } });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const atual = await meu(id, uid);
  if (!atual) return NextResponse.json({ erro: "Marco não encontrado" }, { status: 404 });

  await prisma.marco.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
