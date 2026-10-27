/**
 * Carrega, para UMA pergunta, os registros de saúde que o assistente pode usar.
 *
 * Três travas, nesta ordem:
 *  1. consentimento: sem "Assistente e saúde" ligado, devolve `{ autorizado: false }` e NÃO
 *     LÊ NENHUMA tabela de registro;
 *  2. minimização: só busca o que a pergunta precisa (`intencoes`);
 *  3. resiliência: tabela ainda inexistente (db push pendente) vira "sem dado", nunca erro
 *     para a pessoa no meio de uma conversa.
 */
import { prisma } from "@/lib/db";
import { intencoes, type DadosSaude, type DadosTratamento, type DadosUnhas } from "@/lib/conhecimento/assistente";
import { temaPorId } from "@/lib/conhecimento/catalogo";
import { diaLocalDe } from "@/lib/datas";
import { carregarRastreio } from "@/lib/servicos/habitos";
import { listarHumor } from "@/lib/servicos/humor";
import { lerPreferenciaSaude, tabelaAusente } from "@/lib/servicos/preferencias";
import { carregarSono } from "@/lib/servicos/sono";
import { carregarTratamento, listarTratamentos } from "@/lib/servicos/tratamento";
import { cruzarHumorESono, compararSemanas, descreverComparacao, observarHumorPorSono } from "@/lib/rastreio/humor";
import { diaDoRegistro } from "@/lib/sono";
import { somarDias } from "@/lib/rastreio/episodios";

async function seguro<T>(f: () => Promise<T>): Promise<T | null> {
  try {
    return await f();
  } catch (e) {
    if (tabelaAusente(e)) return null;
    throw e;
  }
}

export async function carregarDadosSaude(uid: string, pergunta: string, tz: string, agora: number = Date.now()): Promise<DadosSaude> {
  const pref = await lerPreferenciaSaude(prisma, uid);
  if (!pref.assistenteUsaSaude) return { autorizado: false };

  const quer = intencoes(pergunta);
  const dados: DadosSaude = { autorizado: true };

  if (quer.tratamento) {
    dados.tratamento = await seguro(async () => {
      const lista = await listarTratamentos(prisma, uid);
      // O primeiro acompanhamento cujo medicamento o catálogo conhece; "outro" não tem conteúdo.
      const alvo = lista.find((t) => temaPorId(t.medicamentoId)?.categoria === "medicamento");
      if (!alvo) return null;
      const c = await carregarTratamento(prisma, uid, alvo.id, tz, agora);
      if (!c) return null;
      const r = c.resumo;
      const saida: DadosTratamento = {
        nome: c.tratamento.nome,
        medicamentoId: c.tratamento.medicamentoId,
        desdeInicio: r.desdeInicio,
        dose: r.doseAtual ? { descricao: r.doseAtual.descricao, contagem: r.doseAtual.contagem } : null,
        sequencia: r.sequenciaConfirmada,
        totalNaoTomou: r.totalNaoTomou,
        // os 3 mais recentes bastam: o assistente não precisa do histórico inteiro
        efeitos: c.efeitos.slice(0, 3).map((e) => ({ dia: e.dia, descricao: e.descricao })),
      };
      return saida;
    });
  }

  if (quer.unhas) {
    dados.unhas = await seguro(async () => {
      const c = await carregarRastreio(prisma, uid, "unhas", tz, agora);
      if (!c) return null;
      const r = c.resumo;
      const saida: DadosUnhas = {
        totalEpisodios: r.totalEpisodios,
        totalDiasConfirmados: r.totalDiasConfirmados,
        sequencia: r.sequenciaConfirmada,
        diasDesdeReferencia: r.diasDesdeReferencia,
        referencia: r.referencia,
        diasSemInformacao: r.diasSemInformacao,
      };
      return saida;
    });
  }

  if (quer.sonoHumor) {
    const hoje = diaLocalDe(agora, tz);
    const desde = somarDias(hoje, -14);
    const [sono, humores] = await Promise.all([
      seguro(() => carregarSono(prisma, uid, tz, agora)),
      seguro(() => listarHumor(prisma, uid, desde)),
    ]);
    if (sono) {
      // qualidade média por dia (pelo dia em que a pessoa acordou)
      const porDia = new Map<string, number[]>();
      for (const s of sono.historico) {
        const d = diaDoRegistro(s, tz);
        porDia.set(d, [...(porDia.get(d) ?? []), s.qualidade]);
      }
      const qualidades = [...porDia.entries()].map(([dia, q]) => ({ dia, valor: q.reduce((a, b) => a + b, 0) / q.length }));
      dados.comparacaoSono = descreverComparacao("qualidade de sono", compararSemanas(qualidades, hoje));
      if (humores) {
        const tabela = cruzarHumorESono(
          humores.map((h) => ({ dia: h.dia, humor: h.humor })),
          qualidades.map((q) => ({ dia: q.dia, qualidade: q.valor })),
          hoje,
          14
        );
        dados.cruzamentoHumorSono = observarHumorPorSono(tabela).texto;
      }
    }
  }
  return dados;
}
