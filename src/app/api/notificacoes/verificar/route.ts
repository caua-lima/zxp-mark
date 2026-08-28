import { NextResponse } from "next/server";
import { usuarioId } from "@/lib/auth";
import { processarUsuario } from "@/lib/motor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Rede de segurança: sempre que o app abre, roda o motor só para este usuário.
 * Se o cron atrasar (ou o plano da Vercel limitar a frequência), os marcos
 * atingidos ainda chegam assim que a pessoa abre o app.
 */
export async function POST() {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  try {
    const r = await processarUsuario(uid);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.error("[verificar]", e);
    return NextResponse.json({ ok: false, enviadas: 0 });
  }
}
