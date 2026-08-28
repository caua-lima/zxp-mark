import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { DetalheMarco } from "@/components/DetalheMarco";

export const dynamic = "force-dynamic";

export default async function PaginaMarco({ params }: { params: Promise<{ id: string }> }) {
  const uid = (await usuarioId())!;
  const { id } = await params;

  const marco = await prisma.marco.findFirst({
    where: { id, userId: uid, arquivadoEm: null },
    include: { recaidas: { orderBy: { quando: "desc" } } },
  });
  if (!marco) notFound();

  return (
    <DetalheMarco
      agora={Date.now()}
      marco={{
        id: marco.id,
        titulo: marco.titulo,
        preset: marco.preset,
        emoji: marco.emoji,
        porque: marco.porque,
        inicio: marco.inicio.toISOString(),
        cicloInicio: marco.cicloInicio.toISOString(),
        melhorMs: Number(marco.melhorMs),
        unidadesPorDia: marco.unidadesPorDia,
        gastoDiario: marco.gastoDiario,
        recaidas: marco.recaidas.map((r) => ({
          id: r.id,
          quando: r.quando.toISOString(),
          duracaoMs: Number(r.duracaoMs),
          gatilho: r.gatilho,
          nota: r.nota,
        })),
      }}
    />
  );
}
