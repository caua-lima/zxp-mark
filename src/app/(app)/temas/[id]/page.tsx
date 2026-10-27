import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { sessaoValida } from "@/lib/auth";
import { fusoDoUsuario } from "@/lib/usuario";
import { diaLocalDe } from "@/lib/datas";
import { temaPorId } from "@/lib/conhecimento/catalogo";
import { TemaConteudo } from "@/components/TemaConteudo";
import { RastreioUnhas, type DadosUnhas } from "@/components/saude/RastreioUnhas";
import { RastreioTratamento, type DadosTratamentoUI, type TratamentoUI } from "@/components/saude/RastreioTratamento";
import { carregarRastreio } from "@/lib/servicos/habitos";
import { carregarTratamento, listarTratamentos } from "@/lib/servicos/tratamento";
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
    const agora = Date.now();
    const lista = await listarTratamentos(prisma, uid);
    const tratamentos: TratamentoUI[] = [];
    for (const l of lista) {
      const c = await carregarTratamento(prisma, uid, l.id, tz, agora);
      if (!c) continue;
      tratamentos.push({
        id: c.tratamento.id,
        nome: c.tratamento.nome,
        inicio: diaLocalDe(c.tratamento.inicio, tz),
        horario: c.tratamento.horario,
        doCatalogo: c.tratamento.medicamentoId === temaId,
        resumo: c.resumo,
        cartoes: c.cartoes,
        doses: c.doses.map((d) => ({ id: d.id, descricao: d.descricao, desdeDia: diaLocalDe(d.desde, tz), nota: d.nota })),
        efeitos: c.efeitos.map((e) => ({ id: e.id, dia: e.dia, descricao: e.descricao, intensidade: e.intensidade })),
        tomadasRecentes: c.tomadas.slice(0, 14).map((t) => ({ dia: t.dia, estado: t.estado })),
        resumoParaConsulta: c.resumoParaConsulta,
      });
    }
    return { estado: "pronto", tratamentos, hoje: diaLocalDe(agora, tz) };
  } catch (e) {
    if (tabelaAusente(e)) return { estado: "indisponivel" };
    throw e;
  }
}

export default async function PaginaTema({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tema = temaPorId(id);
  if (!tema) notFound();

  const uid = (await sessaoValida())!;
  const tz = await fusoDoUsuario(uid);

  let progresso: React.ReactNode;
  if (tema.rastreio.tipo === "episodios") {
    progresso = <RastreioUnhas temaId={tema.id} dados={await dadosUnhas(uid, tema.id, tz)} />;
  } else if (tema.rastreio.tipo === "medicamento") {
    progresso = <RastreioTratamento tituloTema={tema.titulo} dados={await dadosTratamento(uid, tema.id, tz)} />;
  } else {
    progresso = (
      <p className="text-[14px] leading-relaxed text-suave">
        Este tema ainda não tem acompanhamento por registros. Você pode ler o conteúdo abaixo e usar as contagens em Marcos.
      </p>
    );
  }

  return (
    <main className="pb-6">
      <Link href="/temas" className="mb-3 inline-block text-[13px] text-apagado active:text-suave">
        ← Temas
      </Link>
      <TemaConteudo tema={tema} progresso={progresso} />
    </main>
  );
}
