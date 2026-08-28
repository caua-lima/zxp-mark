import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";

export const runtime = "nodejs";

const Corpo = z.object({
  gatilho: z.string().max(120).optional(),
  nota: z.string().max(2000).optional(),
  /** quando aconteceu; padrão = agora */
  quando: z.string().datetime().optional(),
});

/**
 * Registra uma recaída: guarda quanto durou a sequência, atualiza o recorde
 * pessoal e reinicia o cronômetro a partir de agora.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const marco = await prisma.marco.findFirst({ where: { id, userId: uid, arquivadoEm: null } });
  if (!marco) return NextResponse.json({ erro: "Marco não encontrado" }, { status: 404 });

  const dados = Corpo.safeParse(await req.json().catch(() => ({})));
  if (!dados.success) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });

  const agora = new Date();
  const quando = dados.data.quando ? new Date(dados.data.quando) : agora;
  const duracaoMs = Math.max(0, quando.getTime() - marco.cicloInicio.getTime());
  const melhor = duracaoMs > Number(marco.melhorMs) ? BigInt(duracaoMs) : marco.melhorMs;

  const [, atualizado] = await prisma.$transaction([
    prisma.recaida.create({
      data: {
        marcoId: id,
        quando,
        duracaoMs: BigInt(duracaoMs),
        gatilho: dados.data.gatilho?.trim() || null,
        nota: dados.data.nota?.trim() || null,
      },
    }),
    prisma.marco.update({
      where: { id },
      data: { cicloInicio: quando, melhorMs: melhor },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    duracaoMs,
    marco: { ...atualizado, melhorMs: Number(atualizado.melhorMs) },
  });
}
