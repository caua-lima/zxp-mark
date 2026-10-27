import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { comSessao, corpo, resposta } from "@/lib/api-saude";
import { editarEvento, removerEvento } from "@/lib/servicos/habitos";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const Edicao = z.object({
  intensidade: z.number().int().nullable().optional(),
  contexto: z.string().max(60).nullable().optional(),
  estrategia: z.string().max(60).nullable().optional(),
  desconforto: z.number().int().nullable().optional(),
  aparencia: z.number().int().nullable().optional(),
  valor: z.number().nullable().optional(),
  nota: z.string().max(300).nullable().optional(),
});

export function PATCH(req: Request, ctx: Ctx) {
  return comSessao(async ({ uid, tz }) => {
    const { id } = await ctx.params;
    const c = await corpo(req, Edicao);
    if (!c.ok) return c.res;
    const r = await editarEvento(prisma, uid, id, c.valor, tz);
    return r.ok ? NextResponse.json({ ok: true }) : resposta(r);
  });
}

export function DELETE(_req: Request, ctx: Ctx) {
  return comSessao(async ({ uid }) => {
    const { id } = await ctx.params;
    return resposta(await removerEvento(prisma, uid, id), () => ({}));
  });
}
