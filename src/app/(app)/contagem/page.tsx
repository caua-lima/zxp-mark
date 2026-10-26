import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { fusoDoUsuario } from "@/lib/usuario";
import { textoLocal } from "@/lib/datas";
import { listarAcompanhamentos } from "@/lib/servicos/acompanhamentos";
import { Contagens } from "@/components/Contagens";
import { Acompanhamentos, type AcompanhamentoDados } from "@/components/Acompanhamentos";
import { SeletorModo, lerModo } from "@/components/SeletorModo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contagem" };

type Linha = Awaited<ReturnType<typeof listarAcompanhamentos>>[number];

function serializar(a: Linha, fuso: string): AcompanhamentoDados {
  return {
    id: a.id,
    titulo: a.titulo,
    categoria: a.categoria,
    emoji: a.emoji,
    tom: a.tom,
    descricao: a.descricao,
    inicio: a.inicio.toISOString(),
    inicioTexto: textoLocal(a.inicio, fuso),
    arquivadoEm: a.arquivadoEm?.toISOString() ?? null,
  };
}

/**
 * A aba tem dois jeitos de contar, escolhidos pela URL (?modo=desde|regressiva).
 * Sem parâmetro, abre na Regressiva — o comportamento de antes, para quem já
 * tem o endereço salvo ou o atalho na tela inicial.
 */
export default async function PaginaContagem({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string | string[] }>;
}) {
  const uid = (await usuarioId())!;
  const modo = lerModo((await searchParams).modo);
  const [fuso, agora] = [await fusoDoUsuario(uid), Date.now()];

  return (
    <main>
      <header className="mb-4">
        <p className="text-[13px] text-apagado">O tempo, de dois jeitos</p>
        <h1 className="text-[26px] font-semibold tracking-tight">Contagem</h1>
      </header>

      <SeletorModo modo={modo} />

      {modo === "desde" ? (
        <Acompanhamentos
          agora={agora}
          fuso={fuso}
          ativos={(await listarAcompanhamentos(prisma, uid, { arquivados: false })).map((a) =>
            serializar(a, fuso)
          )}
          arquivados={(await listarAcompanhamentos(prisma, uid, { arquivados: true })).map((a) =>
            serializar(a, fuso)
          )}
        />
      ) : (
        <ListaRegressiva uid={uid} agora={agora} fuso={fuso} />
      )}
    </main>
  );
}

async function ListaRegressiva({ uid, agora, fuso }: { uid: string; agora: number; fuso: string }) {
  const [ativas, arquivadas] = await Promise.all([
    prisma.contagem.findMany({ where: { userId: uid, arquivadoEm: null }, orderBy: { alvo: "asc" } }),
    prisma.contagem.findMany({ where: { userId: uid, arquivadoEm: { not: null } }, orderBy: { alvo: "desc" } }),
  ]);

  const paraCliente = (c: (typeof ativas)[number]) => ({
    id: c.id,
    titulo: c.titulo,
    emoji: c.emoji,
    descricao: c.descricao,
    alvo: c.alvo.toISOString(),
    criadoEm: c.criadoEm.toISOString(),
    avisoDiario: c.avisoDiario,
    horaAviso: c.horaAviso,
    avisos: c.avisos,
    notificar: c.notificar,
  });

  return (
    <Contagens
      agora={agora}
      fuso={fuso}
      inicial={ativas.map(paraCliente)}
      arquivadas={arquivadas.map(paraCliente)}
    />
  );
}
