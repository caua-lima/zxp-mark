import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { fusoDoUsuario } from "@/lib/usuario";
import { textoLocal } from "@/lib/datas";
import { obterAcompanhamento } from "@/lib/servicos/acompanhamentos";
import { resolverReferencia } from "@/lib/servicos/progresso";
import { montarPainel } from "@/lib/painel-progresso";
import { DetalheAcompanhamento } from "@/components/DetalheAcompanhamento";

export const dynamic = "force-dynamic";

export default async function PaginaAcompanhamento({ params }: { params: Promise<{ id: string }> }) {
  const uid = (await usuarioId())!;
  const { id } = await params;

  const a = await obterAcompanhamento(prisma, uid, id);
  if (!a) notFound();

  const agora = Date.now();
  const fuso = await fusoDoUsuario(uid);
  const ref = await resolverReferencia(prisma, uid, "acompanhamento", id, agora);
  if (!ref) notFound();
  const trilha = await montarPainel(prisma, uid, ref, { categoria: a.categoria });

  return (
    <DetalheAcompanhamento
      agora={agora}
      fuso={fuso}
      trilha={trilha}
      dados={{
        id: a.id,
        titulo: a.titulo,
        categoria: a.categoria,
        emoji: a.emoji,
        tom: a.tom,
        descricao: a.descricao,
        inicio: a.inicio.toISOString(),
        inicioTexto: textoLocal(a.inicio, fuso),
        arquivadoEm: a.arquivadoEm?.toISOString() ?? null,
      }}
    />
  );
}
