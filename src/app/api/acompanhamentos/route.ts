import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sessaoValida } from "@/lib/auth";
import { fusoDoUsuario } from "@/lib/usuario";
import { criarAcompanhamento, listarAcompanhamentos } from "@/lib/servicos/acompanhamentos";

export const runtime = "nodejs";

const Corpo = z.object({
  titulo: z.string().optional(),
  categoria: z.string().optional(),
  emoji: z.string().optional(),
  tom: z.string().optional(),
  descricao: z.string().nullable().optional(),
  /** relógio de parede no fuso do usuário: "2026-10-14" ou "2026-10-14T08:30" */
  inicio: z.string().optional(),
});

export async function GET(req: Request) {
  const uid = await sessaoValida();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const arquivados = new URL(req.url).searchParams.get("arquivados") === "1";
  const acompanhamentos = await listarAcompanhamentos(prisma, uid, { arquivados });
  return NextResponse.json({ acompanhamentos });
}

export async function POST(req: Request) {
  const uid = await sessaoValida();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const corpo = Corpo.safeParse(await req.json().catch(() => null));
  if (!corpo.success) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });

  const r = await criarAcompanhamento(prisma, uid, corpo.data, await fusoDoUsuario(uid));
  if (!r.ok) return NextResponse.json({ erro: r.erro }, { status: r.status });
  return NextResponse.json({ ok: true, acompanhamento: r.valor });
}
