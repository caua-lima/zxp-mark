import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { preset, situacao, DIA } from "@/lib/habitos";
import { impacto } from "@/lib/formato";
import {
  Conquistas,
  type Conquista,
  type ProximaConquista,
  type Recordes,
} from "@/components/Conquistas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conquistas" };

export default async function PaginaConquistas() {
  const uid = (await usuarioId())!;
  const marcos = await prisma.marco.findMany({
    where: { userId: uid, arquivadoEm: null },
    include: { recaidas: true },
  });

  const agora = Date.now();
  const conquistas: Conquista[] = [];
  const proximas: ProximaConquista[] = [];

  let anteriores = 0;
  let melhor = 0;
  let dinheiro = 0;
  let msLimpos = 0;

  for (const m of marcos) {
    const decorrido = Math.max(0, agora - m.cicloInicio.getTime());
    const p = preset(m.preset);
    const s = situacao(m.preset, decorrido);
    const inicio = m.cicloInicio.getTime();

    for (const x of s.atingidos) {
      conquistas.push({
        marcoId: m.id,
        marcoTitulo: m.titulo,
        emoji: m.emoji,
        chave: x.chave,
        titulo: x.titulo,
        corpo: x.corpo,
        ms: x.ms,
        em: new Date(inicio + x.ms).toISOString(),
      });
    }

    // Os marcos batidos antes de cada recaída não somem — só saem da lista.
    for (const r of m.recaidas) {
      anteriores += p.marcos.filter((x) => x.ms <= Number(r.duracaoMs)).length;
    }

    if (s.proximo) {
      proximas.push({
        marcoId: m.id,
        emoji: m.emoji,
        titulo: s.proximo.titulo,
        faltaMs: s.proximo.ms - decorrido,
        ms: s.proximo.ms,
      });
    }

    melhor = Math.max(melhor, decorrido, Number(m.melhorMs));
    msLimpos += decorrido;
    dinheiro +=
      impacto(
        {
          preset: m.preset,
          cicloInicio: m.cicloInicio,
          unidadesPorDia: m.unidadesPorDia,
          gastoDiario: m.gastoDiario,
        },
        agora
      ).dinheiroEconomizado ?? 0;
  }

  conquistas.sort((a, b) => new Date(b.em).getTime() - new Date(a.em).getTime());
  proximas.sort((a, b) => a.faltaMs - b.faltaMs);

  const recordes: Recordes = {
    total: conquistas.length,
    emTentativasAnteriores: anteriores,
    melhorSequenciaMs: melhor,
    dinheiroTotal: dinheiro,
    diasLimpos: Math.floor(msLimpos / DIA),
    marcosAtivos: marcos.filter((m) => m.ativo).length,
  };

  return (
    <Conquistas conquistas={conquistas} proximas={proximas.slice(0, 3)} recordes={recordes} />
  );
}
