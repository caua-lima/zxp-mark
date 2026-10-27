import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sessaoValida } from "@/lib/auth";
import {
  apagarDadosDeSaude,
  definirAssistenteUsaSaude,
  lerPreferenciaSaude,
  tabelaAusente,
} from "@/lib/servicos/preferencias";

export const runtime = "nodejs";

export async function GET() {
  const uid = await sessaoValida();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  return NextResponse.json(await lerPreferenciaSaude(prisma, uid));
}

/** Liga ou desliga o uso dos registros de saúde pelo assistente. Desligado é o padrão. */
export async function PUT(req: Request) {
  const uid = await sessaoValida();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  const corpo = z.object({ assistenteUsaSaude: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!corpo.success) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });
  try {
    const r = await definirAssistenteUsaSaude(prisma, uid, corpo.data.assistenteUsaSaude);
    return NextResponse.json({ ok: true, ...(r.ok ? r.valor : {}) });
  } catch (e) {
    if (tabelaAusente(e)) {
      return NextResponse.json(
        { erro: "Esta função ainda não está disponível: o banco precisa ser atualizado (npm run db:push)." },
        { status: 503 }
      );
    }
    throw e;
  }
}

/** Apaga os dados de saúde desta conta: hábitos acompanhados, medicamentos e "como estou". */
export async function DELETE() {
  const uid = await sessaoValida();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  try {
    const r = await apagarDadosDeSaude(prisma, uid);
    if (!r.ok) return NextResponse.json({ ok: true, nada: true });
    return NextResponse.json({ ok: true, ...r.valor });
  } catch (e) {
    if (tabelaAusente(e)) return NextResponse.json({ ok: true, nada: true });
    throw e;
  }
}
