import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { Chat } from "@/components/Chat";

export const dynamic = "force-dynamic";

export default async function PaginaAjuda() {
  const uid = (await usuarioId())!;

  const [mensagens, marcos] = await Promise.all([
    prisma.mensagem.findMany({
      where: { userId: uid },
      orderBy: { criadaEm: "asc" },
      take: 100,
      select: { id: true, papel: true, conteudo: true },
    }),
    prisma.marco.count({ where: { userId: uid, arquivadoEm: null } }),
  ]);

  return (
    <Suspense fallback={<div className="pulso h-40 rounded-3xl bg-white/[0.03]" />}>
      <Chat
        temMarcos={marcos > 0}
        inicial={mensagens.map((m) => ({
          id: m.id,
          papel: m.papel === "user" ? ("user" as const) : ("assistant" as const),
          conteudo: m.conteudo,
        }))}
      />
    </Suspense>
  );
}
