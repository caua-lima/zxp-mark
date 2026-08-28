import webpush from "web-push";
import { prisma } from "@/lib/db";

export function chavePublica(): string | undefined {
  return process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
}

let configurado = false;

function configurar() {
  if (configurado) return;
  const pub = chavePublica();
  const priv = process.env.VAPID_PRIVATE_KEY;
  const contato = process.env.VAPID_SUBJECT || "mailto:contato@example.com";
  if (!pub || !priv) {
    throw new Error(
      "Chaves VAPID ausentes. Rode npm run vapid e defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY."
    );
  }
  webpush.setVapidDetails(contato, pub, priv);
  configurado = true;
}

export type Payload = {
  titulo: string;
  corpo: string;
  url?: string;
  tag?: string;
  /** vibra e mantém a notificação na tela até interação */
  urgente?: boolean;
};

/**
 * Envia para todos os dispositivos do usuário. Assinaturas mortas (404/410)
 * são removidas do banco automaticamente.
 */
export async function enviarPush(userId: string, payload: Payload): Promise<number> {
  configurar();

  const inscricoes = await prisma.inscricao.findMany({ where: { userId } });
  if (inscricoes.length === 0) return 0;

  const corpo = JSON.stringify(payload);
  let entregues = 0;

  await Promise.all(
    inscricoes.map(async (i) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: i.endpoint,
            keys: { p256dh: i.p256dh, auth: i.auth },
          },
          corpo,
          { TTL: 60 * 60 * 12, urgency: payload.urgente ? "high" : "normal" }
        );
        entregues++;
        await prisma.inscricao.update({
          where: { id: i.id },
          data: { usadaEm: new Date() },
        });
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.inscricao.delete({ where: { id: i.id } }).catch(() => {});
        } else {
          console.error("[push] falha ao enviar", status, (e as Error).message);
        }
      }
    })
  );

  return entregues;
}
