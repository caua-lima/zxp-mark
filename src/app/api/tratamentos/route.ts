import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { comSessao, corpo, resposta } from "@/lib/api-saude";
import { criarTratamento, listarTratamentos } from "@/lib/servicos/tratamento";
import { identificarMedicamento } from "@/lib/rastreio/medicamento";
import { TEMAS } from "@/lib/conhecimento/catalogo";

export const runtime = "nodejs";

export function GET(req: Request) {
  return comSessao(async ({ uid }) => {
    const arquivados = new URL(req.url).searchParams.get("arquivados") === "1";
    return NextResponse.json({ tratamentos: await listarTratamentos(prisma, uid, arquivados) });
  });
}

const Criar = z.object({
  nome: z.string().max(60),
  confirmouSugestao: z.boolean().optional(),
  inicio: z.string().max(10),
  horario: z.string().max(5).nullable().optional(),
  dose: z
    .object({
      descricao: z.string().max(40),
      mg: z.number().nullable().optional(),
      desde: z.string().max(10).optional(),
      nota: z.string().max(300).nullable().optional(),
    })
    .optional(),
});

/**
 * Cria o acompanhamento. Se o nome parecer um erro de digitação (ex.: "exscitalopram"), a
 * resposta é 409 com a sugestão e NADA é salvo até a pessoa confirmar.
 */
export function POST(req: Request) {
  return comSessao(async ({ uid, tz }) => {
    const c = await corpo(req, Criar);
    if (!c.ok) return c.res;
    const r = await criarTratamento(prisma, uid, c.valor, tz);
    if (!r.ok && r.status === 409) {
      const id = identificarMedicamento(c.valor.nome, TEMAS);
      return NextResponse.json(
        { erro: r.erro, confirmar: id.tipo === "confirmar" ? id.sugestao : null },
        { status: 409 }
      );
    }
    return resposta(r, (tratamento) => ({ tratamento }));
  });
}
