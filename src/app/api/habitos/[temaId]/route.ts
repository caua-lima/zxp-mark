import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { comSessao, corpo, resposta } from "@/lib/api-saude";
import { arquivarHabito, atualizarHabito, carregarRastreio, excluirHabito } from "@/lib/servicos/habitos";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ temaId: string }> };

export function GET(_req: Request, ctx: Ctx) {
  return comSessao(async ({ uid, tz }) => {
    const { temaId } = await ctx.params;
    const r = await carregarRastreio(prisma, uid, temaId, tz);
    if (!r) return NextResponse.json({ erro: "Acompanhamento não encontrado." }, { status: 404 });
    return NextResponse.json({ rastreio: r });
  });
}

const Patch = z.object({
  objetivo: z.string().max(300).nullable().optional(),
  metaSemanal: z.number().int().min(0).max(10_000).nullable().optional(),
  arquivado: z.boolean().optional(),
});

export function PATCH(req: Request, ctx: Ctx) {
  return comSessao(async ({ uid }) => {
    const { temaId } = await ctx.params;
    const c = await corpo(req, Patch);
    if (!c.ok) return c.res;
    const { arquivado, ...resto } = c.valor;
    if (Object.keys(resto).length > 0) {
      const r = await atualizarHabito(prisma, uid, temaId, resto);
      if (!r.ok) return resposta(r);
    }
    if (arquivado !== undefined) {
      const r = await arquivarHabito(prisma, uid, temaId, arquivado);
      if (!r.ok) return resposta(r);
    }
    return NextResponse.json({ ok: true });
  });
}

/** Apaga o acompanhamento e todos os registros dele. */
export function DELETE(_req: Request, ctx: Ctx) {
  return comSessao(async ({ uid }) => {
    const { temaId } = await ctx.params;
    return resposta(await excluirHabito(prisma, uid, temaId), () => ({}));
  });
}
