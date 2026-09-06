import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { Contagens } from "@/components/Contagens";

export const dynamic = "force-dynamic";

export default async function PaginaContagem() {
  const uid = (await usuarioId())!;
  const contagens = await prisma.contagem.findMany({
    where: { userId: uid },
    orderBy: { alvo: "asc" },
  });

  return (
    <Contagens
      agora={Date.now()}
      inicial={contagens.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        emoji: c.emoji,
        descricao: c.descricao,
        alvo: c.alvo.toISOString(),
        criadoEm: c.criadoEm.toISOString(),
        avisoDiario: c.avisoDiario,
        avisos: c.avisos,
        notificar: c.notificar,
      }))}
    />
  );
}
