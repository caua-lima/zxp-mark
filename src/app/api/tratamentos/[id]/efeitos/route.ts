import { z } from "zod";
import { prisma } from "@/lib/db";
import { comSessao, corpo, resposta } from "@/lib/api-saude";
import { registrarEfeito } from "@/lib/servicos/tratamento";

export const runtime = "nodejs";

const Efeito = z.object({
  dia: z.string().max(10).optional(),
  descricao: z.string().max(300),
  intensidade: z.number().int().nullable().optional(),
  nota: z.string().max(300).nullable().optional(),
});

/** Registra algo que a pessoa notou (efeito colateral, mudança). Fica no histórico dela. */
export function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return comSessao(async ({ uid, tz }) => {
    const { id } = await ctx.params;
    const c = await corpo(req, Efeito);
    if (!c.ok) return c.res;
    return resposta(await registrarEfeito(prisma, uid, id, c.valor, tz), (efeito) => ({ efeito }));
  });
}
