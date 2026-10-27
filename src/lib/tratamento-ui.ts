/**
 * Monta, no servidor, o que as telas de tratamento mostram (cartão da aba Marcos e página do tema).
 * Um só lugar para o mapeamento: as duas telas nunca divergem nas contagens.
 * Lança o erro do Prisma se as tabelas não existem; quem chama decide (tabelaAusente).
 */
import { prisma } from "@/lib/db";
import { diaLocalDe } from "@/lib/datas";
import { carregarTratamento, listarTratamentos } from "@/lib/servicos/tratamento";
import type { TratamentoUI } from "@/components/saude/RastreioTratamento";

export async function tratamentosUI(uid: string, tz: string, agora: number, medicamentoId?: string) {
  const lista = await listarTratamentos(prisma, uid);
  const tratamentos: TratamentoUI[] = [];
  for (const l of lista) {
    const c = await carregarTratamento(prisma, uid, l.id, tz, agora);
    if (!c) continue;
    tratamentos.push({
      id: c.tratamento.id,
      nome: c.tratamento.nome,
      medicamentoId: c.tratamento.medicamentoId,
      inicio: diaLocalDe(c.tratamento.inicio, tz),
      horario: c.tratamento.horario,
      lembrete: c.tratamento.lembrete,
      lembreteDetalhado: c.tratamento.lembreteDetalhado,
      doCatalogo: medicamentoId !== undefined && c.tratamento.medicamentoId === medicamentoId,
      resumo: c.resumo,
      cartoes: c.cartoes,
      doses: c.doses.map((d) => ({ id: d.id, descricao: d.descricao, desdeDia: diaLocalDe(d.desde, tz), nota: d.nota })),
      efeitos: c.efeitos.map((e) => ({ id: e.id, dia: e.dia, descricao: e.descricao, intensidade: e.intensidade })),
      tomadasRecentes: c.tomadas.slice(0, 14).map((t) => ({ dia: t.dia, estado: t.estado })),
      resumoParaConsulta: c.resumoParaConsulta,
    });
  }
  return { tratamentos, hoje: diaLocalDe(agora, tz) };
}
