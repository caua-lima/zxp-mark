import { z } from "zod";
import { prisma } from "@/lib/db";
import { comSessao, corpo, resposta } from "@/lib/api-saude";
import { registrarDose } from "@/lib/servicos/tratamento";

export const runtime = "nodejs";

const Dose = z.object({
  descricao: z.string().max(40),
  mg: z.number().nullable().optional(),
  desde: z.string().max(10),
  nota: z.string().max(300).nullable().optional(),
});

/**
 * Informa uma dose (a da prescrição, escrita pela pessoa). Acrescenta ao histórico: não
 * reinicia o tratamento, as tomadas nem a sequência.
 */
export function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return comSessao(async ({ uid, tz }) => {
    const { id } = await ctx.params;
    const c = await corpo(req, Dose);
    if (!c.ok) return c.res;
    return resposta(await registrarDose(prisma, uid, id, c.valor, tz), (v) => ({ ...v }));
  });
}
