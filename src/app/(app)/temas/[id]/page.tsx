import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { sessaoValida } from "@/lib/auth";
import { fusoDoUsuario } from "@/lib/usuario";
import { diaLocalDe } from "@/lib/datas";
import { temaPorId } from "@/lib/conhecimento/catalogo";
import { TemaConteudo } from "@/components/TemaConteudo";
import { RastreioUnhas, type DadosUnhas } from "@/components/saude/RastreioUnhas";
import { RastreioTratamento, type DadosTratamentoUI } from "@/components/saude/RastreioTratamento";
import { carregarRastreio } from "@/lib/servicos/habitos";
import { tratamentosUI } from "@/lib/tratamento-ui";
import { tabelaAusente } from "@/lib/servicos/preferencias";

export const dynamic = "force-dynamic";

async function dadosUnhas(uid: string, temaId: string, tz: string): Promise<DadosUnhas> {
  try {
    const r = await carregarRastreio(prisma, uid, temaId, tz);
    if (!r || r.habito.arquivadoEm) return { estado: "nao-iniciado" };
    return {
      estado: "ativo",
      resumo: r.resumo,
      marcos: r.marcos,
      semanas: r.semanas,
      contexto: r.contextoMaisFrequente,
      estrategias: r.estrategias,
      eventos: r.eventos.slice(0, 20).map((e) => ({
        id: e.id,
        tipo: e.tipo,
        dia: e.dia,
        intensidade: e.intensidade,
        contexto: e.contexto,
        estrategia: e.estrategia,
        nota: e.nota,
      })),
    };
  } catch (e) {
    if (tabelaAusente(e)) return { estado: "indisponivel" };
    throw e;
  }
}

async function dadosTratamento(uid: string, temaId: string, tz: string): Promise<DadosTratamentoUI> {
  try {
    const { tratamentos, hoje } = await tratamentosUI(uid, tz, Date.now(), temaId);
    return { estado: "pronto", tratamentos, hoje };
  } catch (e) {
    if (tabelaAusente(e)) return { estado: "indisponivel" };
    throw e;
  }
}

function Atalho({ texto, href, rotulo }: { texto: string; href: string; rotulo: string }) {
  return (
    <div className="space-y-3">
      <p className="text-[14px] leading-relaxed text-suave">{texto}</p>
      <Link href={href} className="inline-block rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-[14.5px] text-tinta active:bg-white/10">
        {rotulo}
      </Link>
    </div>
  );
}

export default async function PaginaTema({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uid = (await sessaoValida())!;
  const tz = await fusoDoUsuario(uid);

  // Remédio que não está no catálogo: só o acompanhamento, sem conteúdo educativo.
  if (id === "outro") {
    return (
      <main className="pb-6">
        <Link href="/marcos" className="mb-3 inline-block text-[13px] text-apagado active:text-suave">
          ← Marcos
        </Link>
        <h1 className="mb-4 text-[26px] font-semibold tracking-tight">Remédios</h1>
        <div className="cartao p-5">
          <RastreioTratamento tituloTema="o remédio" dados={await dadosTratamento(uid, "outro", tz)} />
        </div>
      </main>
    );
  }

  const tema = temaPorId(id);
  if (!tema) notFound();

  let progresso: React.ReactNode;
  if (tema.rastreio.tipo === "episodios") {
    progresso = <RastreioUnhas temaId={tema.id} dados={await dadosUnhas(uid, tema.id, tz)} />;
  } else if (tema.rastreio.tipo === "medicamento") {
    progresso = <RastreioTratamento tituloTema={tema.titulo} dados={await dadosTratamento(uid, tema.id, tz)} />;
  } else if (tema.rastreio.tipo === "sono") {
    progresso = <Atalho texto="O registro de sono fica na aba de sono, e o que você registrar lá é seu." href="/sono" rotulo="Abrir o registro de sono" />;
  } else if (tema.rastreio.tipo === "marcos") {
    progresso = <Atalho texto="O seu tempo sem fumar é acompanhado em Marcos, com os benefícios de cada etapa." href="/marcos" rotulo="Abrir Marcos" />;
  } else {
    progresso = (
      <p className="text-[14px] leading-relaxed text-suave">
        Este tema não tem acompanhamento por registros: é conteúdo para ler e usar no seu ritmo. Se quiser contar um tempo, crie um marco em Marcos.
      </p>
    );
  }

  return (
    <main className="pb-6">
      <Link href="/marcos" className="mb-3 inline-block text-[13px] text-apagado active:text-suave">
        ← Marcos
      </Link>
      <TemaConteudo tema={tema} progresso={progresso} />
    </main>
  );
}
