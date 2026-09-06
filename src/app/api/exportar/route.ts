import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Backup completo da conta em JSON. É o seu histórico — se um dia quiser sair
 * daqui, sai com ele na mão. Não inclui hash de senha nem inscrições push.
 */
export async function GET() {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      nome: true,
      email: true,
      timezone: true,
      criadoEm: true,
      marcos: {
        orderBy: { criadoEm: "asc" },
        select: {
          titulo: true,
          preset: true,
          emoji: true,
          porque: true,
          inicio: true,
          cicloInicio: true,
          melhorMs: true,
          unidadesPorDia: true,
          gastoDiario: true,
          ativo: true,
          criadoEm: true,
          recaidas: {
            orderBy: { quando: "desc" },
            select: { quando: true, duracaoMs: true, gatilho: true, nota: true },
          },
        },
      },
      contagens: {
        orderBy: { alvo: "asc" },
        select: { titulo: true, emoji: true, descricao: true, alvo: true, avisos: true, criadoEm: true },
      },
      mensagens: {
        orderBy: { criadaEm: "asc" },
        select: { papel: true, conteudo: true, criadaEm: true },
      },
    },
  });
  if (!u) return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 });

  const dados = {
    app: "ZXP Mark",
    exportadoEm: new Date().toISOString(),
    perfil: { nome: u.nome, email: u.email, timezone: u.timezone, criadoEm: u.criadoEm },
    marcos: u.marcos.map((m) => ({
      ...m,
      melhorMs: Number(m.melhorMs),
      recaidas: m.recaidas.map((r) => ({ ...r, duracaoMs: Number(r.duracaoMs) })),
    })),
    contagens: u.contagens,
    conversas: u.mensagens,
  };

  const nome = `marco-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(dados, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${nome}"`,
      "cache-control": "no-store",
    },
  });
}
