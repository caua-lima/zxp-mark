import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { enviarPush } from "@/lib/push";
import { preset } from "@/lib/habitos";
import { duracaoExtenso } from "@/lib/formato";

export const runtime = "nodejs";

/** Dispara uma notificação de teste igual às reais, com os dados de verdade. */
export async function POST() {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const marco = await prisma.marco.findFirst({
    where: { userId: uid, ativo: true, arquivadoEm: null },
    orderBy: { criadoEm: "asc" },
  });

  const payload = marco
    ? (() => {
        const p = preset(marco.preset);
        const d = Date.now() - marco.cicloInicio.getTime();
        return {
          titulo: `${p.emoji} TESTE — ${duracaoExtenso(d).toUpperCase()} ${p.sufixo.toUpperCase()}`,
          corpo: "É exatamente assim que a notificação vai chegar quando você bater um marco de verdade. Continue firme.",
          url: `/marcos/${marco.id}`,
          tag: "teste",
          urgente: true,
        };
      })()
    : {
        titulo: "🔔 Notificação de teste",
        corpo: "Funcionou. Crie seu primeiro marco e eu passo a te avisar a cada conquista.",
        url: "/marcos",
        tag: "teste",
      };

  const entregues = await enviarPush(uid, payload);
  if (entregues === 0) {
    return NextResponse.json(
      { erro: "Nenhum dispositivo recebeu. Ative as notificações neste aparelho primeiro." },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, entregues });
}
