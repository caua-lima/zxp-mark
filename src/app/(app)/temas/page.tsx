import Link from "next/link";
import { prisma } from "@/lib/db";
import { sessaoValida } from "@/lib/auth";
import { TEMAS } from "@/lib/conhecimento/catalogo";
import { ListaTemas, type ResumoTema } from "@/components/ListaTemas";
import { tabelaAusente } from "@/lib/servicos/preferencias";

export const dynamic = "force-dynamic";

/** Temas que a pessoa já acompanha. Banco sem as tabelas novas = ninguém acompanha ainda. */
async function acompanhados(uid: string): Promise<Set<string>> {
  try {
    const [habitos, tratamentos] = await Promise.all([
      prisma.habitoAcompanhado.findMany({ where: { userId: uid, arquivadoEm: null }, select: { temaId: true } }),
      prisma.tratamento.findMany({ where: { userId: uid, arquivadoEm: null }, select: { medicamentoId: true } }),
    ]);
    return new Set([...habitos.map((h) => h.temaId), ...tratamentos.map((t) => t.medicamentoId)]);
  } catch (e) {
    if (tabelaAusente(e)) return new Set();
    throw e;
  }
}

export default async function PaginaTemas() {
  const uid = (await sessaoValida())!;
  const seus = await acompanhados(uid);

  const temas: ResumoTema[] = TEMAS.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao,
    categoria: t.categoria,
    nomesAlternativos: t.nomesAlternativos,
    termos: t.termos,
    padroes: t.padroes,
    status: t.status,
    acompanhando: seus.has(t.id),
  }));

  return (
    <main>
      <header className="mb-5">
        <Link href="/marcos" className="text-[13px] text-apagado active:text-suave">
          ← Marcos
        </Link>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Temas</h1>
        <p className="mt-1 text-[14px] leading-relaxed text-suave">
          Conteúdo educativo com fontes, e acompanhamento por registros quando faz sentido. Não substitui orientação de
          profissional de saúde.
        </p>
      </header>
      <ListaTemas temas={temas} />
    </main>
  );
}
