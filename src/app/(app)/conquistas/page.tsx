import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { preset, situacao, DIA } from "@/lib/habitos";
import { impacto } from "@/lib/formato";
import { conteudoDaEtapa } from "@/lib/beneficios";
import { etapasDoAcompanhamento, etapasDoSono, posicionar } from "@/lib/progressao";
import { diasRegistrados } from "@/lib/sono";
import { fusoDoUsuario } from "@/lib/usuario";
import { instanteLocal } from "@/lib/datas";
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

  // A contagem crescente e o sono entram na MESMA lista: um só lugar para ver o
  // que foi conquistado, em vez de um segundo sistema de conquistas.
  const [acompanhamentos, sonos, fuso] = await Promise.all([
    prisma.acompanhamento.findMany({ where: { userId: uid, arquivadoEm: null } }),
    prisma.sono.findMany({ where: { userId: uid }, select: { acordouEm: true } }),
    fusoDoUsuario(uid),
  ]);

  const etapasA = etapasDoAcompanhamento();
  for (const a of acompanhamentos) {
    const decorrido = Math.max(0, agora - a.inicio.getTime());
    const pos = posicionar(etapasA, decorrido);
    for (const e of etapasA) {
      if (e.inicial || e.limiar > decorrido) continue;
      conquistas.push({
        marcoId: a.id,
        marcoTitulo: a.titulo,
        emoji: a.emoji,
        chave: e.chave,
        titulo: e.titulo,
        corpo: conteudoDaEtapa({ tipo: "acompanhamento", categoria: a.categoria, etapa: e, proxima: null }).conquista,
        ms: e.limiar,
        em: new Date(a.inicio.getTime() + e.limiar).toISOString(),
      });
    }
    if (pos.atual) {
      proximas.push({
        marcoId: a.id,
        emoji: a.emoji,
        titulo: pos.atual.titulo,
        faltaMs: pos.falta,
        ms: pos.atual.limiar,
      });
    }
  }

  const noites = diasRegistrados(sonos, fuso);
  for (const e of etapasDoSono()) {
    if (e.inicial || e.limiar > noites.length) continue;
    const quando = instanteLocal(noites[e.limiar - 1], fuso);
    if (!quando) continue;
    conquistas.push({
      marcoId: "sono",
      marcoTitulo: "Sono",
      emoji: "🌙",
      chave: e.chave,
      titulo: e.titulo,
      corpo: conteudoDaEtapa({ tipo: "sono", etapa: e, proxima: null }).conquista,
      ms: e.limiar,
      rotulo: `${e.limiar} ${e.limiar === 1 ? "noite" : "noites"}`,
      em: quando.toISOString(),
    });
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
