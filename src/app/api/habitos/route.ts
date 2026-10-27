import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { comSessao, corpo, resposta } from "@/lib/api-saude";
import { iniciarHabito } from "@/lib/servicos/habitos";

export const runtime = "nodejs";

const Iniciar = z.object({
  temaId: z.string().min(1).max(60),
  objetivo: z.string().max(300).nullable().optional(),
  metaSemanal: z.number().int().min(0).max(10_000).nullable().optional(),
});

/** Começa (ou retoma) o acompanhamento por registros de um tema. Idempotente. */
export function POST(req: Request) {
  return comSessao(async ({ uid }) => {
    const c = await corpo(req, Iniciar);
    if (!c.ok) return c.res;
    return resposta(await iniciarHabito(prisma, uid, c.valor), (habito) => ({ habito }));
  });
}

export function GET() {
  return comSessao(async ({ uid }) => {
    const habitos = await prisma.habitoAcompanhado.findMany({ where: { userId: uid }, orderBy: { criadoEm: "asc" } });
    return NextResponse.json({ habitos });
  });
}
