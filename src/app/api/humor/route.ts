import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { comSessao, corpo, resposta } from "@/lib/api-saude";
import { listarHumor, registrarHumor, removerHumor } from "@/lib/servicos/humor";

export const runtime = "nodejs";

export function GET() {
  return comSessao(async ({ uid }) => NextResponse.json({ registros: await listarHumor(prisma, uid) }));
}

const Humor = z.object({
  dia: z.string().max(10).optional(),
  humor: z.number().int(),
  energia: z.number().int().nullable().optional(),
  ansiedade: z.number().int().nullable().optional(),
  nota: z.string().max(300).nullable().optional(),
});

/** “Como estou” do dia. Registrar de novo no mesmo dia edita o registro. */
export function POST(req: Request) {
  return comSessao(async ({ uid, tz }) => {
    const c = await corpo(req, Humor);
    if (!c.ok) return c.res;
    return resposta(await registrarHumor(prisma, uid, c.valor, tz), (registro) => ({ registro }));
  });
}

export function DELETE(req: Request) {
  return comSessao(async ({ uid }) => {
    const dia = new URL(req.url).searchParams.get("dia") ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return NextResponse.json({ erro: "Informe o dia." }, { status: 400 });
    return resposta(await removerHumor(prisma, uid, dia), () => ({}));
  });
}
