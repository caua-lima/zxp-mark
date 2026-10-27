import { z } from "zod";
import { prisma } from "@/lib/db";
import { comSessao, corpo, resposta } from "@/lib/api-saude";
import { registrarEvento } from "@/lib/servicos/habitos";

export const runtime = "nodejs";

const Evento = z.object({
  tipo: z.string().max(20),
  dia: z.string().max(10).optional(),
  intensidade: z.number().int().nullable().optional(),
  contexto: z.string().max(60).nullable().optional(),
  estrategia: z.string().max(60).nullable().optional(),
  desconforto: z.number().int().nullable().optional(),
  aparencia: z.number().int().nullable().optional(),
  valor: z.number().nullable().optional(),
  nota: z.string().max(300).nullable().optional(),
});

/** Registra episódio, vontade, dia sem ou prática. A validação de fato mora no serviço. */
export function POST(req: Request, ctx: { params: Promise<{ temaId: string }> }) {
  return comSessao(async ({ uid, tz }) => {
    const { temaId } = await ctx.params;
    const c = await corpo(req, Evento);
    if (!c.ok) return c.res;
    return resposta(await registrarEvento(prisma, uid, temaId, c.valor, tz), (v) => ({ ...v }));
  });
}
