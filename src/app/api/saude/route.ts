import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { provedorAtivo } from "@/lib/ia/provedores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnóstico de deploy: diz o que está configurado e o que falta, sem
 * expor nenhum valor. Protegido pelo CRON_SECRET:
 *
 *   GET /api/saude?chave=<CRON_SECRET>
 */
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  const chave = new URL(req.url).searchParams.get("chave");
  const auth = req.headers.get("authorization");

  if (!segredo || (chave !== segredo && auth !== `Bearer ${segredo}`)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const definido = (v?: string) => Boolean(v && v.length > 8);

  let banco: { ok: boolean; detalhe: string; usuarios?: number; inscricoes?: number };
  try {
    const [usuarios, inscricoes] = await Promise.all([
      prisma.user.count(),
      prisma.inscricao.count(),
    ]);
    banco = { ok: true, detalhe: "conectado", usuarios, inscricoes };
  } catch (e) {
    banco = { ok: false, detalhe: (e as Error).message.slice(0, 200) };
  }

  const ambiente = {
    DATABASE_URL: definido(process.env.DATABASE_URL),
    AUTH_SECRET: definido(process.env.AUTH_SECRET),
    VAPID_PUBLIC_KEY: definido(process.env.VAPID_PUBLIC_KEY),
    VAPID_PRIVATE_KEY: definido(process.env.VAPID_PRIVATE_KEY),
    VAPID_SUBJECT: definido(process.env.VAPID_SUBJECT),
    GROQ_API_KEY: definido(process.env.GROQ_API_KEY),
    GEMINI_API_KEY: definido(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    OPENROUTER_API_KEY: definido(process.env.OPENROUTER_API_KEY),
    ANTHROPIC_API_KEY: definido(process.env.ANTHROPIC_API_KEY),
    CRON_SECRET: definido(process.env.CRON_SECRET),
  };

  const OPCIONAIS = new Set(["GROQ_API_KEY", "GEMINI_API_KEY", "OPENROUTER_API_KEY", "ANTHROPIC_API_KEY"]);
  const faltando = Object.entries(ambiente)
    .filter(([k, ok]) => !ok && !OPCIONAIS.has(k))
    .map(([k]) => k);

  const ia = provedorAtivo();

  return NextResponse.json({
    ok: banco.ok && faltando.length === 0,
    banco,
    ambiente,
    faltando,
    recursos: {
      notificacoes: ambiente.VAPID_PUBLIC_KEY && ambiente.VAPID_PRIVATE_KEY,
      chat: { motor: ia.id, rotulo: ia.rotulo, modelo: ia.modelo, gratuito: ia.gratuito },
      cron: ambiente.CRON_SECRET,
    },
    agora: new Date().toISOString(),
  });
}
