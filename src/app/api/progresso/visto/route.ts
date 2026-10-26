import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sessaoValida } from "@/lib/auth";
import { ehTipo, marcarVistas } from "@/lib/servicos/progresso";

export const runtime = "nodejs";

const Corpo = z.object({
  tipo: z.string(),
  refId: z.string().min(1).max(64),
  chaves: z.array(z.string().max(32)).min(1).max(40),
});

/**
 * "Já vi essa celebração." Idempotente: repetir a chamada (toque duplo, duas
 * abas) não cria nada. O servidor recalcula quais etapas foram atingidas — o
 * que o navegador mandar além disso é ignorado.
 */
export async function POST(req: Request) {
  const uid = await sessaoValida();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const corpo = Corpo.safeParse(await req.json().catch(() => null));
  if (!corpo.success || !ehTipo(corpo.data.tipo)) {
    return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });
  }

  const r = await marcarVistas(prisma, uid, corpo.data.tipo, corpo.data.refId, corpo.data.chaves);
  if (!r.ok) return NextResponse.json({ erro: r.erro }, { status: r.status });
  return NextResponse.json({ ok: true, ...r.valor });
}
