import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { comSessao, corpo, resposta } from "@/lib/api-saude";
import {
  arquivarTratamento,
  atualizarTratamento,
  carregarTratamento,
  excluirTratamento,
} from "@/lib/servicos/tratamento";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export function GET(_req: Request, ctx: Ctx) {
  return comSessao(async ({ uid, tz }) => {
    const { id } = await ctx.params;
    const t = await carregarTratamento(prisma, uid, id, tz);
    if (!t) return NextResponse.json({ erro: "Acompanhamento não encontrado." }, { status: 404 });
    return NextResponse.json({ tratamento: t });
  });
}

const Patch = z.object({
  horario: z.string().max(5).nullable().optional(),
  lembrete: z.boolean().optional(),
  lembreteDetalhado: z.boolean().optional(),
  arquivado: z.boolean().optional(),
});

export function PATCH(req: Request, ctx: Ctx) {
  return comSessao(async ({ uid }) => {
    const { id } = await ctx.params;
    const c = await corpo(req, Patch);
    if (!c.ok) return c.res;
    const { arquivado, ...resto } = c.valor;
    if (Object.keys(resto).length > 0) {
      const r = await atualizarTratamento(prisma, uid, id, resto);
      if (!r.ok) return resposta(r);
    }
    if (arquivado !== undefined) {
      const r = await arquivarTratamento(prisma, uid, id, arquivado);
      if (!r.ok) return resposta(r);
    }
    return NextResponse.json({ ok: true });
  });
}

/** Apaga o acompanhamento com tomadas, doses e efeitos. */
export function DELETE(_req: Request, ctx: Ctx) {
  return comSessao(async ({ uid }) => {
    const { id } = await ctx.params;
    return resposta(await excluirTratamento(prisma, uid, id), () => ({}));
  });
}
