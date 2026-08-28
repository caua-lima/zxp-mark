/**
 * Motor de notificações.
 *
 * Roda a cada poucos minutos (cron) e também quando o app é aberto. Decide o
 * que está "vencido" para cada usuário e dispara o push — sempre gravando um
 * registro em `Enviada` ANTES de enviar, para que dois ticks simultâneos nunca
 * mandem a mesma notificação duas vezes.
 */
import { prisma } from "@/lib/db";
import { enviarPush, type Payload } from "@/lib/push";
import { DIA, preset } from "@/lib/habitos";
import { diaLocal, duracaoExtenso, horaLocal, reais, rotuloMs, impacto } from "@/lib/formato";

const EPOCH = new Date(0);

/** Marcos atingidos há mais tempo que isso são registrados sem notificar. */
const JANELA_ATRASO = 6 * 60 * 60 * 1000;

type Item = { tipo: string; refId: string; chave: string; ciclo: Date; payload: Payload };

/**
 * Grava o registro e envia. Retorna false se já tinha sido enviada antes.
 */
async function despachar(userId: string, item: Item, mudo = false): Promise<boolean> {
  try {
    await prisma.enviada.create({
      data: {
        userId,
        tipo: item.tipo,
        refId: item.refId,
        chave: item.chave,
        ciclo: item.ciclo,
        titulo: item.payload.titulo,
        corpo: item.payload.corpo,
      },
    });
  } catch {
    return false; // violação de unique = já enviada
  }
  if (mudo) return false;
  await enviarPush(userId, item.payload);
  return true;
}

function dentroDaJanela(hora: number, alvo: number, largura = 3) {
  return hora >= alvo && hora < alvo + largura;
}

/** Diferença em dias de calendário no fuso do usuário. */
function diasDeCalendario(tz: string, de: Date, ate: Date): number {
  const a = Date.parse(`${diaLocal(tz, de)}T00:00:00Z`);
  const b = Date.parse(`${diaLocal(tz, ate)}T00:00:00Z`);
  return Math.round((b - a) / DIA);
}

export type Resultado = { enviadas: number; detalhes: string[] };

export async function processarUsuario(userId: string, agora = new Date()): Promise<Resultado> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      marcos: { where: { ativo: true, arquivadoEm: null } },
      contagens: true,
      _count: { select: { inscricoes: true } },
    },
  });
  if (!u) return { enviadas: 0, detalhes: [] };

  // Sem nenhum dispositivo inscrito não há o que enviar — e não queremos
  // "queimar" os registros de dedupe antes da pessoa ativar as notificações.
  if (u._count.inscricoes === 0) return { enviadas: 0, detalhes: ["sem dispositivos"] };

  const tz = u.timezone || "America/Sao_Paulo";
  const hora = horaLocal(tz, agora);
  const hoje = diaLocal(tz, agora);
  const detalhes: string[] = [];
  let enviadas = 0;

  /* ------------------------------ marcos -------------------------------- */
  if (u.notifMarcos) {
    for (const m of u.marcos) {
      const decorrido = agora.getTime() - m.cicloInicio.getTime();
      if (decorrido < 0) continue;

      const p = preset(m.preset);
      const atingidos = p.marcos.filter((x) => x.ms <= decorrido);
      if (atingidos.length === 0) continue;

      const jaEnviadas = new Set(
        (
          await prisma.enviada.findMany({
            where: { refId: m.id, ciclo: m.cicloInicio },
            select: { chave: true },
          })
        ).map((e) => e.chave)
      );

      const pendentes = atingidos.filter((x) => !jaEnviadas.has(x.chave));
      if (pendentes.length === 0) continue;

      // Só o marco mais recente vira notificação; os antigos ficam registrados
      // em silêncio para não estourar o celular com uma rajada.
      const ultimo = pendentes[pendentes.length - 1];
      const atrasado = decorrido - ultimo.ms > JANELA_ATRASO;

      for (const x of pendentes) {
        const eOUltimo = x.chave === ultimo.chave;
        const mudo = !eOUltimo || atrasado;
        const st = impacto(
          { preset: m.preset, cicloInicio: m.cicloInicio, unidadesPorDia: m.unidadesPorDia, gastoDiario: m.gastoDiario },
          agora.getTime()
        );
        const extras: string[] = [];
        if (st.dinheiroEconomizado && st.dinheiroEconomizado >= 1)
          extras.push(`${reais(st.dinheiroEconomizado)} economizados`);
        if (st.unidadesEvitadas && st.unidadesEvitadas >= 1)
          extras.push(`${st.unidadesEvitadas} ${st.unidadeNome} a menos`);

        const ok = await despachar(
          userId,
          {
            tipo: "marco",
            refId: m.id,
            chave: x.chave,
            ciclo: m.cicloInicio,
            payload: {
              titulo: `${p.emoji} ${x.titulo.toUpperCase()}`,
              corpo: extras.length ? `${x.corpo}\n\n${extras.join(" · ")}` : x.corpo,
              url: `/marcos/${m.id}`,
              tag: `marco-${m.id}`,
              urgente: true,
            },
          },
          mudo
        );
        if (ok) {
          enviadas++;
          detalhes.push(`marco ${m.titulo} → ${x.chave}`);
        }
      }
    }
  }

  /* ---------------------------- contagens ------------------------------- */
  for (const c of u.contagens) {
    if (!c.notificar) continue;
    const restante = c.alvo.getTime() - agora.getTime();

    if (restante <= 0) {
      // Chegou o dia.
      const ok = await despachar(userId, {
        tipo: "contagem",
        refId: c.id,
        chave: "chegou",
        ciclo: c.alvo,
        payload: {
          titulo: `${c.emoji} CHEGOU O DIA: ${c.titulo}`,
          corpo: c.descricao?.trim()
            ? `${c.descricao.trim()}\n\nÉ hoje. Aproveita.`
            : "É hoje. Você contou os dias até aqui — aproveita cada minuto.",
          url: "/contagem",
          tag: `contagem-${c.id}`,
        },
      });
      if (ok) {
        enviadas++;
        detalhes.push(`contagem ${c.titulo} → chegou`);
      }
      continue;
    }

    const faltam = diasDeCalendario(tz, agora, c.alvo);
    if (!c.avisos.includes(faltam)) continue;
    if (!dentroDaJanela(hora, u.horaResumo)) continue;

    const corpo =
      faltam === 0
        ? "É hoje! Contagem encerrada."
        : faltam === 1
          ? "Falta 1 dia. Confere se está tudo pronto."
          : `Faltam ${faltam} dias.`;

    const ok = await despachar(userId, {
      tipo: "contagem",
      refId: c.id,
      chave: `d-${faltam}`,
      ciclo: c.alvo,
      payload: {
        titulo: `${c.emoji} ${c.titulo}`,
        corpo: c.descricao?.trim() ? `${corpo} ${c.descricao.trim()}` : corpo,
        url: "/contagem",
        tag: `contagem-${c.id}`,
      },
    });
    if (ok) {
      enviadas++;
      detalhes.push(`contagem ${c.titulo} → d-${faltam}`);
    }
  }

  /* ------------------------- resumo da manhã ---------------------------- */
  if (u.notifResumoDiario && dentroDaJanela(hora, u.horaResumo) && (u.marcos.length || u.contagens.length)) {
    const linhas: string[] = [];
    for (const m of u.marcos.slice(0, 4)) {
      const d = agora.getTime() - m.cicloInicio.getTime();
      const p = preset(m.preset);
      const prox = p.marcos.find((x) => x.ms > d);
      linhas.push(
        prox
          ? `${p.emoji} ${duracaoExtenso(d)} ${p.sufixo} — próximo marco: ${rotuloMs(prox.ms)}`
          : `${p.emoji} ${duracaoExtenso(d)} ${p.sufixo}`
      );
    }
    const proxima = u.contagens
      .filter((c) => c.alvo.getTime() > agora.getTime())
      .sort((a, b) => a.alvo.getTime() - b.alvo.getTime())[0];
    if (proxima) {
      const faltam = diasDeCalendario(tz, agora, proxima.alvo);
      linhas.push(`${proxima.emoji} ${proxima.titulo}: faltam ${faltam} ${faltam === 1 ? "dia" : "dias"}`);
    }

    if (linhas.length) {
      const ok = await despachar(userId, {
        tipo: "resumo",
        refId: userId,
        chave: `resumo-${hoje}`,
        ciclo: EPOCH,
        payload: {
          titulo: `Bom dia, ${u.nome.split(" ")[0]}`,
          corpo: linhas.join("\n"),
          url: "/marcos",
          tag: "resumo",
        },
      });
      if (ok) {
        enviadas++;
        detalhes.push("resumo diário");
      }
    }
  }

  /* --------------------------- fecho da noite --------------------------- */
  if (u.notifNoite && dentroDaJanela(hora, u.horaNoite) && u.marcos.length) {
    const m = u.marcos[0];
    const d = agora.getTime() - m.cicloInicio.getTime();
    const p = preset(m.preset);
    const ok = await despachar(userId, {
      tipo: "noite",
      refId: userId,
      chave: `noite-${hoje}`,
      ciclo: EPOCH,
      payload: {
        titulo: `${p.emoji} Mais um dia fechado`,
        corpo: `${duracaoExtenso(d)} ${p.sufixo}. Dormir agora é a forma mais fácil de ganhar as próximas 8 horas. Amanhã você acorda com esse número maior.`,
        url: "/marcos",
        tag: "noite",
      },
    });
    if (ok) {
      enviadas++;
      detalhes.push("fecho da noite");
    }
  }

  return { enviadas, detalhes };
}

/** Percorre todos os usuários que têm ao menos um dispositivo inscrito. */
export async function processarTodos(agora = new Date()) {
  const usuarios = await prisma.user.findMany({
    where: { inscricoes: { some: {} } },
    select: { id: true },
  });

  let total = 0;
  const detalhes: string[] = [];
  for (const u of usuarios) {
    try {
      const r = await processarUsuario(u.id, agora);
      total += r.enviadas;
      detalhes.push(...r.detalhes);
    } catch (e) {
      console.error("[motor] erro no usuário", u.id, e);
    }
  }
  return { usuarios: usuarios.length, enviadas: total, detalhes };
}
