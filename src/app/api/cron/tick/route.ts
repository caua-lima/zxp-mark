import { NextResponse } from "next/server";
import { processarTodos } from "@/lib/motor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Varre todos os usuários e envia o que estiver vencido.
 *
 * Protegido por CRON_SECRET, aceito de duas formas:
 *   - header `Authorization: Bearer <CRON_SECRET>`  (é o que a Vercel manda)
 *   - query `?chave=<CRON_SECRET>`                  (para cron externo)
 */
function autorizado(req: Request): boolean {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return false;

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${segredo}`) return true;

  const chave = new URL(req.url).searchParams.get("chave");
  return chave === segredo;
}

async function executar(req: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { erro: "CRON_SECRET não configurado no ambiente." },
      { status: 500 }
    );
  }
  if (!autorizado(req)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const inicio = Date.now();
  const r = await processarTodos();
  return NextResponse.json({ ok: true, ...r, ms: Date.now() - inicio });
}

export async function GET(req: Request) {
  return executar(req);
}

export async function POST(req: Request) {
  return executar(req);
}
