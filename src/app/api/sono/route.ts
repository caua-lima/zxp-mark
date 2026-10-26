import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sessaoValida } from "@/lib/auth";
import { fusoDoUsuario } from "@/lib/usuario";
import { carregarSono, criarSono } from "@/lib/servicos/sono";

export const runtime = "nodejs";

const CorpoSono = z.object({
  /** relógio de parede no fuso do usuário: "2026-10-25T23:30" */
  dormiuEm: z.string(),
  acordouEm: z.string(),
  qualidade: z.number(),
  nota: z.string().nullable().optional(),
});

export async function GET() {
  const uid = await sessaoValida();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const dados = await carregarSono(prisma, uid, await fusoDoUsuario(uid));
  return NextResponse.json(dados);
}

export async function POST(req: Request) {
  const uid = await sessaoValida();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const corpo = CorpoSono.safeParse(await req.json().catch(() => null));
  if (!corpo.success) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });

  const r = await criarSono(prisma, uid, corpo.data, await fusoDoUsuario(uid));
  if (!r.ok) return NextResponse.json({ erro: r.erro }, { status: r.status });
  return NextResponse.json({ ok: true, sono: r.valor });
}
