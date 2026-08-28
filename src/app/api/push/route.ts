import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { chavePublica, enviarPush } from "@/lib/push";

export const runtime = "nodejs";

/** Chave pública VAPID + quantos dispositivos já estão inscritos. */
export async function GET() {
  const uid = await usuarioId();
  const chave = chavePublica() ?? null;
  if (!uid) return NextResponse.json({ chave, dispositivos: 0 });

  const dispositivos = await prisma.inscricao.count({ where: { userId: uid } });
  return NextResponse.json({ chave, dispositivos });
}

const Inscricao = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(10).max(300),
    auth: z.string().min(4).max(300),
  }),
  agente: z.string().max(400).optional(),
});

/** Registra (ou reaproveita) a inscrição push deste dispositivo. */
export async function POST(req: Request) {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const dados = Inscricao.safeParse(await req.json().catch(() => null));
  if (!dados.success) return NextResponse.json({ erro: "Inscrição inválida" }, { status: 400 });

  const { endpoint, keys, agente } = dados.data;

  await prisma.inscricao.upsert({
    where: { endpoint },
    update: { userId: uid, p256dh: keys.p256dh, auth: keys.auth, usadaEm: new Date() },
    create: { userId: uid, endpoint, p256dh: keys.p256dh, auth: keys.auth, agente: agente ?? null },
  });

  const dispositivos = await prisma.inscricao.count({ where: { userId: uid } });

  // Confirmação imediata: se essa chegar no celular, o canal está de pé.
  await enviarPush(uid, {
    titulo: "🔔 Notificações ligadas",
    corpo: "É assim que você vai receber cada marco atingido. Pode fechar o app — eu te aviso.",
    url: "/marcos",
    tag: "boas-vindas",
  }).catch(() => {});

  return NextResponse.json({ ok: true, dispositivos });
}

const Cancelar = z.object({ endpoint: z.string().url().max(2000) });

export async function DELETE(req: Request) {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const dados = Cancelar.safeParse(await req.json().catch(() => null));
  if (!dados.success) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });

  await prisma.inscricao.deleteMany({ where: { userId: uid, endpoint: dados.data.endpoint } });
  const dispositivos = await prisma.inscricao.count({ where: { userId: uid } });
  return NextResponse.json({ ok: true, dispositivos });
}
