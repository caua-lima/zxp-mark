import { prisma } from "@/lib/db";
import { type MarcoDef, preset, situacao } from "@/lib/habitos";
import {
  dataLonga,
  diaLocal,
  duracaoExtenso,
  horaLocal,
  impacto,
  reais,
  rotuloMs,
} from "@/lib/formato";

/**
 * Retrato exato da situação da pessoa agora.
 *
 * É a única fonte de verdade do chat: o motor local lê estes objetos direto,
 * e os provedores de LLM recebem a versão em texto de `emTexto()`. Assim as
 * duas respostas nunca discordam sobre um número.
 */

export type RetratoRecaida = {
  quando: Date;
  duracaoMs: number;
  gatilho: string | null;
  nota: string | null;
};

export type RetratoMarco = {
  id: string;
  titulo: string;
  presetId: string;
  rotulo: string;
  emoji: string;
  sufixo: string;
  contextoClinico: string;
  porque: string | null;
  ativo: boolean;
  inicioCiclo: Date;
  decorridoMs: number;
  melhorMs: number;
  atingidos: MarcoDef[];
  totalMarcos: number;
  anterior: MarcoDef | null;
  proximo: MarcoDef | null;
  faltaMs: number | null;
  dinheiro: number | null;
  unidades: number | null;
  unidadeNome: string;
  minutosVida: number | null;
  recaidas: RetratoRecaida[];
};

export type RetratoContagem = {
  titulo: string;
  emoji: string;
  descricao: string | null;
  alvo: Date;
  faltaMs: number;
};

export type Retrato = {
  nome: string;
  primeiroNome: string;
  timezone: string;
  hora: number;
  dia: string;
  criadoEm: Date;
  marcos: RetratoMarco[];
  contagens: RetratoContagem[];
};

export async function retratoDoUsuario(userId: string, agora = new Date()): Promise<Retrato | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      marcos: {
        where: { arquivadoEm: null },
        orderBy: { criadoEm: "asc" },
        include: { recaidas: { orderBy: { quando: "desc" }, take: 5 } },
      },
      contagens: { orderBy: { alvo: "asc" } },
    },
  });
  if (!u) return null;

  const tz = u.timezone || "America/Sao_Paulo";

  const marcos: RetratoMarco[] = u.marcos.map((m) => {
    const decorridoMs = Math.max(0, agora.getTime() - m.cicloInicio.getTime());
    const p = preset(m.preset);
    const s = situacao(m.preset, decorridoMs);
    const st = impacto(
      {
        preset: m.preset,
        cicloInicio: m.cicloInicio,
        unidadesPorDia: m.unidadesPorDia,
        gastoDiario: m.gastoDiario,
      },
      agora.getTime()
    );

    return {
      id: m.id,
      titulo: m.titulo,
      presetId: m.preset,
      rotulo: p.rotulo,
      emoji: m.emoji,
      sufixo: p.sufixo,
      contextoClinico: p.contexto,
      porque: m.porque?.trim() || null,
      ativo: m.ativo,
      inicioCiclo: m.cicloInicio,
      decorridoMs,
      melhorMs: Math.max(Number(m.melhorMs), decorridoMs),
      atingidos: s.atingidos,
      totalMarcos: p.marcos.length,
      anterior: s.anterior,
      proximo: s.proximo,
      faltaMs: s.proximo ? s.proximo.ms - decorridoMs : null,
      dinheiro: st.dinheiroEconomizado,
      unidades: st.unidadesEvitadas,
      unidadeNome: st.unidadeNome,
      minutosVida: st.minutosDeVida,
      recaidas: m.recaidas.map((r) => ({
        quando: r.quando,
        duracaoMs: Number(r.duracaoMs),
        gatilho: r.gatilho,
        nota: r.nota,
      })),
    };
  });

  return {
    nome: u.nome,
    primeiroNome: u.nome.split(" ")[0],
    timezone: tz,
    hora: horaLocal(tz, agora),
    dia: diaLocal(tz, agora),
    criadoEm: u.criadoEm,
    marcos,
    contagens: u.contagens.map((c) => ({
      titulo: c.titulo,
      emoji: c.emoji,
      descricao: c.descricao,
      alvo: c.alvo,
      faltaMs: c.alvo.getTime() - agora.getTime(),
    })),
  };
}

/** Marco em foco: o ativo mais recente, ou o primeiro que existir. */
export function marcoPrincipal(r: Retrato): RetratoMarco | null {
  const ativos = r.marcos.filter((m) => m.ativo);
  return ativos[0] ?? r.marcos[0] ?? null;
}

/** Versão em texto do retrato — é o que vai no prompt dos provedores. */
export function emTexto(r: Retrato): string {
  const l: string[] = [];

  l.push(`Nome: ${r.nome}`);
  l.push(`Agora para ela/ele: ${r.dia}, ${String(r.hora).padStart(2, "0")}h (fuso ${r.timezone}).`);
  l.push(`Conta criada em: ${dataLonga(r.criadoEm)}.`);
  l.push("");

  if (r.marcos.length === 0) {
    l.push("HÁBITOS EM ACOMPANHAMENTO: nenhum cadastrado ainda.");
  } else {
    l.push("HÁBITOS EM ACOMPANHAMENTO:");
    for (const m of r.marcos) {
      l.push("");
      l.push(`- "${m.titulo}" (${m.rotulo}${m.ativo ? "" : ", pausado"})`);
      l.push(`  Tempo atual da sequência: ${duracaoExtenso(m.decorridoMs)} ${m.sufixo}.`);
      l.push(`  Sequência iniciada em: ${dataLonga(m.inicioCiclo)}.`);
      if (m.anterior) l.push(`  Último marco batido: "${m.anterior.titulo}".`);
      if (m.proximo && m.faltaMs !== null) {
        l.push(
          `  Próximo marco: "${m.proximo.titulo}" (${rotuloMs(m.proximo.ms)}), faltam ${duracaoExtenso(m.faltaMs)}.`
        );
        l.push(`  O que esse próximo marco significa: ${m.proximo.corpo}`);
      }
      l.push(`  Marcos já conquistados: ${m.atingidos.length} de ${m.totalMarcos}.`);
      if (m.melhorMs > m.decorridoMs)
        l.push(`  Melhor sequência histórica: ${duracaoExtenso(m.melhorMs)}.`);
      if (m.dinheiro) l.push(`  Dinheiro economizado nesta sequência: ${reais(m.dinheiro)}.`);
      if (m.unidades) l.push(`  ${m.unidadeNome} evitados nesta sequência: ${m.unidades}.`);
      if (m.minutosVida && m.minutosVida > 60)
        l.push(`  Estimativa de vida recuperada: ${Math.round(m.minutosVida / 60)} horas.`);
      if (m.porque) l.push(`  O PORQUÊ que ela/ele escreveu: "${m.porque}"`);
      if (m.recaidas.length) {
        l.push(`  Recaídas registradas: ${m.recaidas.length} (mais recentes primeiro):`);
        for (const rc of m.recaidas) {
          const extra = [rc.gatilho, rc.nota].filter(Boolean).join(" — ");
          l.push(
            `    · ${dataLonga(rc.quando)} após ${duracaoExtenso(rc.duracaoMs)}${extra ? ` | ${extra}` : ""}`
          );
        }
      } else {
        l.push("  Nenhuma recaída registrada.");
      }
      l.push(`  Contexto clínico do hábito: ${m.contextoClinico}`);
    }
  }

  l.push("");
  if (r.contagens.length === 0) {
    l.push("CONTAGENS REGRESSIVAS: nenhuma.");
  } else {
    l.push("CONTAGENS REGRESSIVAS:");
    for (const c of r.contagens) {
      l.push(
        c.faltaMs > 0
          ? `- "${c.titulo}" em ${dataLonga(c.alvo)} — faltam ${duracaoExtenso(c.faltaMs)}.${c.descricao ? ` (${c.descricao})` : ""}`
          : `- "${c.titulo}" já aconteceu em ${dataLonga(c.alvo)}.`
      );
    }
  }

  return l.join("\n");
}

/** Compatibilidade: retrato + renderização em texto numa chamada só. */
export async function contextoDoUsuario(userId: string): Promise<string> {
  const r = await retratoDoUsuario(userId);
  return r ? emTexto(r) : "Sem dados do usuário.";
}
