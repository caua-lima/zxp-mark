import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { PRESETS, preset } from "@/lib/habitos";

export const runtime = "nodejs";

const Novo = z.object({
  titulo: z.string().trim().min(2, "Dê um nome ao marco").max(80),
  preset: z.string().default("personalizado"),
  emoji: z.string().max(8).optional(),
  porque: z.string().max(2000).optional(),
  /** ISO. Se ausente, começa agora. */
  cicloInicio: z.string().datetime().optional(),
  unidadesPorDia: z.number().min(0).max(1000).nullable().optional(),
  gastoDiario: z.number().min(0).max(100000).nullable().optional(),
});

export async function GET() {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const marcos = await prisma.marco.findMany({
    where: { userId: uid, arquivadoEm: null },
    orderBy: { criadoEm: "asc" },
    include: { _count: { select: { recaidas: true } } },
  });

  return NextResponse.json({
    marcos: marcos.map((m) => ({ ...m, melhorMs: Number(m.melhorMs) })),
  });
}

export async function POST(req: Request) {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const dados = Novo.safeParse(await req.json().catch(() => null));
  if (!dados.success) {
    return NextResponse.json(
      { erro: dados.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const quantos = await prisma.marco.count({ where: { userId: uid, arquivadoEm: null } });
  if (quantos >= 20) {
    return NextResponse.json({ erro: "Limite de 20 marcos ativos." }, { status: 400 });
  }

  const presetId = PRESETS.some((p) => p.id === dados.data.preset)
    ? dados.data.preset
    : "personalizado";
  const p = preset(presetId);

  const agora = new Date();
  const inicio = dados.data.cicloInicio ? new Date(dados.data.cicloInicio) : agora;
  if (inicio.getTime() > agora.getTime() + 60_000) {
    return NextResponse.json({ erro: "A data de início não pode ser no futuro." }, { status: 400 });
  }

  const marco = await prisma.marco.create({
    data: {
      userId: uid,
      titulo: dados.data.titulo,
      preset: presetId,
      emoji: dados.data.emoji || p.emoji,
      porque: dados.data.porque?.trim() || null,
      inicio,
      cicloInicio: inicio,
      unidadesPorDia: dados.data.unidadesPorDia ?? null,
      gastoDiario: dados.data.gastoDiario ?? null,
    },
  });

  return NextResponse.json({ ok: true, marco: { ...marco, melhorMs: Number(marco.melhorMs) } });
}
