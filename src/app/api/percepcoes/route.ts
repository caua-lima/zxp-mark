import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sessaoValida } from "@/lib/auth";
import { ehTipo, salvarPercepcao } from "@/lib/servicos/progresso";

export const runtime = "nodejs";

const Corpo = z.object({
  tipo: z.string(),
  refId: z.string().min(1).max(64),
  chave: z.string().min(1).max(32),
  humor: z.number().nullable().optional(),
  nota: z.string().nullable().optional(),
});

/**
 * "Como você está se sentindo?" Cria, atualiza ou — com humor e nota vazios —
 * apaga. Responder em branco não é erro.
 */
export async function PUT(req: Request) {
  const uid = await sessaoValida();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const corpo = Corpo.safeParse(await req.json().catch(() => null));
  if (!corpo.success || !ehTipo(corpo.data.tipo)) {
    return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });
  }

  const { tipo, ...resto } = corpo.data;
  const r = await salvarPercepcao(prisma, uid, { tipo, ...resto });
  if (!r.ok) return NextResponse.json({ erro: r.erro }, { status: r.status });
  return NextResponse.json({ ok: true, percepcao: r.valor });
}
