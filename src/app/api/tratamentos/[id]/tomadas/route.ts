import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { comSessao, corpo, resposta } from "@/lib/api-saude";
import { registrarTomada, removerTomada } from "@/lib/servicos/tratamento";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const Tomada = z.object({
  dia: z.string().max(10).optional(),
  estado: z.string().max(12),
  horario: z.string().max(5).nullable().optional(),
  nota: z.string().max(300).nullable().optional(),
});

/** Informa tomei / não tomei de um dia (hoje por padrão). Repetir o mesmo dia edita, não duplica. */
export function POST(req: Request, ctx: Ctx) {
  return comSessao(async ({ uid, tz }) => {
    const { id } = await ctx.params;
    const c = await corpo(req, Tomada);
    if (!c.ok) return c.res;
    return resposta(await registrarTomada(prisma, uid, id, c.valor, tz), (v) => ({ ...v }));
  });
}

/** Apaga a informação de um dia: ele volta a ser “sem informação”. `?dia=YYYY-MM-DD` */
export function DELETE(req: Request, ctx: Ctx) {
  return comSessao(async ({ uid }) => {
    const { id } = await ctx.params;
    const dia = new URL(req.url).searchParams.get("dia") ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return NextResponse.json({ erro: "Informe o dia." }, { status: 400 });
    return resposta(await removerTomada(prisma, uid, id, dia), () => ({}));
  });
}
