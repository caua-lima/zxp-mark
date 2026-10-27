import { prisma } from "@/lib/db";
import { comSessao, resposta } from "@/lib/api-saude";
import { removerDose } from "@/lib/servicos/tratamento";

export const runtime = "nodejs";

export function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return comSessao(async ({ uid }) => {
    const { id } = await ctx.params;
    return resposta(await removerDose(prisma, uid, id), () => ({}));
  });
}
