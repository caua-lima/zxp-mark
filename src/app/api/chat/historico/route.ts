import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const mensagens = await prisma.mensagem.findMany({
    where: { userId: uid },
    orderBy: { criadaEm: "asc" },
    take: 200,
    select: { id: true, papel: true, conteudo: true, criadaEm: true },
  });

  return NextResponse.json({ mensagens });
}

export async function DELETE() {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  await prisma.mensagem.deleteMany({ where: { userId: uid } });
  return NextResponse.json({ ok: true });
}
