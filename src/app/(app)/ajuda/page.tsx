import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { Chat, type Situacao } from "@/components/Chat";
import { preset, situacao as situacaoDo, HORA } from "@/lib/habitos";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ajuda" };

export default async function PaginaAjuda() {
  const uid = (await usuarioId())!;
  const agora = Date.now();

  const [mensagens, marco, contagem] = await Promise.all([
    prisma.mensagem.findMany({
      where: { userId: uid },
      orderBy: { criadaEm: "asc" },
      take: 100,
      select: { id: true, papel: true, conteudo: true },
    }),
    prisma.marco.findFirst({
      where: { userId: uid, arquivadoEm: null },
      orderBy: [{ ativo: "desc" }, { criadoEm: "asc" }],
      include: { _count: { select: { recaidas: true } } },
    }),
    prisma.contagem.findFirst({
      where: { userId: uid, alvo: { gt: new Date() } },
      orderBy: { alvo: "asc" },
      select: { titulo: true },
    }),
  ]);

  let sit: Situacao = {
    temMarcos: false,
    titulo: null,
    emoji: "💬",
    sufixo: "",
    cicloInicio: null,
    proximoTitulo: null,
    proximoFaltaMs: null,
    temRecaida: false,
    contagemTitulo: contagem?.titulo ?? null,
    horas: 0,
  };

  if (marco) {
    const decorrido = Math.max(0, agora - marco.cicloInicio.getTime());
    const p = preset(marco.preset);
    const s = situacaoDo(marco.preset, decorrido);
    sit = {
      temMarcos: true,
      titulo: marco.titulo,
      emoji: marco.emoji,
      sufixo: p.sufixo,
      cicloInicio: marco.cicloInicio.toISOString(),
      proximoTitulo: s.proximo?.titulo ?? null,
      proximoFaltaMs: s.proximo ? s.proximo.ms - decorrido : null,
      temRecaida: marco._count.recaidas > 0,
      contagemTitulo: contagem?.titulo ?? null,
      horas: decorrido / HORA,
    };
  }

  return (
    <Suspense fallback={<div className="pulso h-40 rounded-3xl bg-white/[0.03]" />}>
      <Chat
        situacao={sit}
        inicial={mensagens.map((m) => ({
          id: m.id,
          papel: m.papel === "user" ? ("user" as const) : ("assistant" as const),
          conteudo: m.conteudo,
        }))}
      />
    </Suspense>
  );
}
