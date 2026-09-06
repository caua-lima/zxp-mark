import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { iconePara } from "@/lib/deteccao";

export const runtime = "nodejs";

const Nova = z.object({
  titulo: z.string().trim().min(2, "Dê um nome à contagem").max(80),
  descricao: z.string().max(500).optional(),
  /** ISO com fuso, ex.: 2026-11-13T09:00:00-03:00 */
  alvo: z.string().datetime({ offset: true }),
  avisoDiario: z.boolean().optional(),
  avisos: z.array(z.number().int().min(0).max(365)).max(12).optional(),
  notificar: z.boolean().optional(),
});

export async function GET() {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const contagens = await prisma.contagem.findMany({
    where: { userId: uid },
    orderBy: { alvo: "asc" },
  });
  return NextResponse.json({ contagens });
}

export async function POST(req: Request) {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const dados = Nova.safeParse(await req.json().catch(() => null));
  if (!dados.success) {
    return NextResponse.json(
      { erro: dados.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const quantas = await prisma.contagem.count({ where: { userId: uid } });
  if (quantas >= 30) {
    return NextResponse.json({ erro: "Limite de 30 contagens." }, { status: 400 });
  }

  const descricao = dados.data.descricao?.trim() || null;
  const avisos = [...new Set(dados.data.avisos ?? [30, 14, 7, 3, 1, 0])].sort((a, b) => b - a);

  const contagem = await prisma.contagem.create({
    data: {
      userId: uid,
      titulo: dados.data.titulo,
      // O ícone sai do título; a pessoa não escolhe de uma lista.
      emoji: iconePara(dados.data.titulo, descricao),
      descricao,
      alvo: new Date(dados.data.alvo),
      avisoDiario: dados.data.avisoDiario ?? true,
      avisos,
      notificar: dados.data.notificar ?? true,
    },
  });

  return NextResponse.json({ ok: true, contagem });
}
