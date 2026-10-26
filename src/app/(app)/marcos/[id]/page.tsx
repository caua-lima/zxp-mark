import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { DetalheMarco } from "@/components/DetalheMarco";
import { montarPainel } from "@/lib/painel-progresso";
import { resolverReferencia } from "@/lib/servicos/progresso";

export const dynamic = "force-dynamic";

export default async function PaginaMarco({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editar?: string }>;
}) {
  const uid = (await usuarioId())!;
  const { id } = await params;
  const { editar } = await searchParams;

  const marco = await prisma.marco.findFirst({
    where: { id, userId: uid, arquivadoEm: null },
    include: { recaidas: { orderBy: { quando: "desc" } } },
  });
  if (!marco) notFound();

  const agora = Date.now();
  const ref = await resolverReferencia(prisma, uid, "marco", id, agora);
  if (!ref) notFound();
  const progresso = await montarPainel(prisma, uid, ref, { presetId: marco.preset });

  return (
    <DetalheMarco
      agora={agora}
      trilha={progresso}
      abrirEdicao={editar === "1"}
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
