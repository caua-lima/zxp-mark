import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { tabelaAusente } from "@/lib/servicos/preferencias";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Backup completo da conta em JSON. É o seu histórico — se um dia quiser sair
 * daqui, sai com ele na mão. Não inclui hash de senha nem inscrições push.
 */
export async function GET() {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      nome: true,
      email: true,
      timezone: true,
      criadoEm: true,
      marcos: {
        orderBy: { criadoEm: "asc" },
        select: {
          titulo: true,
          preset: true,
          emoji: true,
          porque: true,
          inicio: true,
          cicloInicio: true,
          melhorMs: true,
          unidadesPorDia: true,
          gastoDiario: true,
          ativo: true,
          criadoEm: true,
          recaidas: {
            orderBy: { quando: "desc" },
            select: { quando: true, duracaoMs: true, gatilho: true, nota: true },
          },
        },
      },
      contagens: {
        orderBy: { alvo: "asc" },
        select: {
          titulo: true,
          emoji: true,
          descricao: true,
          alvo: true,
          avisos: true,
          arquivadoEm: true,
          criadoEm: true,
        },
      },
      acompanhamentos: {
        orderBy: { inicio: "asc" },
        select: {
          titulo: true,
          categoria: true,
          emoji: true,
          tom: true,
          descricao: true,
          inicio: true,
          arquivadoEm: true,
          criadoEm: true,
        },
      },
      sonos: {
        orderBy: { dormiuEm: "asc" },
        select: { dormiuEm: true, acordouEm: true, qualidade: true, nota: true },
      },
      percepcoes: {
        orderBy: { criadaEm: "asc" },
        select: { tipo: true, refId: true, chave: true, humor: true, nota: true, criadaEm: true },
      },
      mensagens: {
        orderBy: { criadaEm: "asc" },
        select: { papel: true, conteudo: true, criadaEm: true },
      },
    },
  });
  if (!u) return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 });

  // O refId de uma percepção não diz nada a quem lê o arquivo: troca pelo título.
  const [marcosDaConta, acompanhamentosDaConta] = await Promise.all([
    prisma.marco.findMany({ where: { userId: uid }, select: { id: true, titulo: true } }),
    prisma.acompanhamento.findMany({ where: { userId: uid }, select: { id: true, titulo: true } }),
  ]);
  const titulos = new Map([...marcosDaConta, ...acompanhamentosDaConta].map((x) => [x.id, x.titulo]));

  // Dados de saúde (hábitos, medicamento, "como estou"): a pessoa leva tudo o que registrou. Se o
  // banco ainda não tem essas tabelas, o backup sai sem esse trecho em vez de falhar.
  let saude: unknown = null;
  try {
    const [habitos, tratamentos, humor, preferencia] = await Promise.all([
      prisma.habitoAcompanhado.findMany({
        where: { userId: uid },
        orderBy: { criadoEm: "asc" },
        select: {
          temaId: true,
          objetivo: true,
          metaSemanal: true,
          inicio: true,
          arquivadoEm: true,
          eventos: {
            orderBy: { quando: "asc" },
            select: { tipo: true, dia: true, quando: true, intensidade: true, contexto: true, estrategia: true, desconforto: true, aparencia: true, valor: true, nota: true },
          },
        },
      }),
      prisma.tratamento.findMany({
        where: { userId: uid },
        orderBy: { criadoEm: "asc" },
        select: {
          medicamentoId: true,
          nome: true,
          inicio: true,
          horario: true,
          lembrete: true,
          lembreteDetalhado: true,
          arquivadoEm: true,
          doses: { orderBy: { desde: "asc" }, select: { descricao: true, mg: true, desde: true, nota: true } },
          tomadas: { orderBy: { dia: "asc" }, select: { dia: true, estado: true, horario: true, nota: true } },
          efeitos: { orderBy: { quando: "asc" }, select: { dia: true, descricao: true, intensidade: true, nota: true } },
        },
      }),
      prisma.registroHumor.findMany({
        where: { userId: uid },
        orderBy: { dia: "asc" },
        select: { dia: true, humor: true, energia: true, ansiedade: true, nota: true },
      }),
      prisma.preferenciaSaude.findUnique({ where: { userId: uid }, select: { assistenteUsaSaude: true } }),
    ]);
    saude = { assistenteUsaSaude: preferencia?.assistenteUsaSaude ?? false, habitos, tratamentos, comoEstou: humor };
  } catch (e) {
    if (!tabelaAusente(e)) throw e;
  }

  const dados = {
    app: "ZXP Mark",
    exportadoEm: new Date().toISOString(),
    perfil: { nome: u.nome, email: u.email, timezone: u.timezone, criadoEm: u.criadoEm },
    marcos: u.marcos.map((m) => ({
      ...m,
      melhorMs: Number(m.melhorMs),
      recaidas: m.recaidas.map((r) => ({ ...r, duracaoMs: Number(r.duracaoMs) })),
    })),
    contagens: u.contagens,
    acompanhamentos: u.acompanhamentos,
    sono: u.sonos,
    // "melhora percebida": o que a própria pessoa escreveu sobre como se sentia
    percepcoes: u.percepcoes.map(({ refId, ...resto }) => ({
      ...resto,
      item: resto.tipo === "sono" ? "Sono" : (titulos.get(refId) ?? null),
    })),
    conversas: u.mensagens,
    saude,
  };

  const nome = `marco-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(dados, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${nome}"`,
      "cache-control": "no-store",
    },
  });
}
