import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { INSTRUCOES, MODELO, contextoDoUsuario } from "@/lib/ia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Corpo = z.object({ mensagem: z.string().trim().min(1).max(4000) });

const LIMITE_HORA = 60;
const HISTORICO = 24;

export async function POST(req: Request) {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { erro: "ANTHROPIC_API_KEY não configurada no servidor." },
      { status: 503 }
    );
  }

  const dados = Corpo.safeParse(await req.json().catch(() => null));
  if (!dados.success) return NextResponse.json({ erro: "Mensagem inválida" }, { status: 400 });

  const recentes = await prisma.mensagem.count({
    where: { userId: uid, papel: "user", criadaEm: { gt: new Date(Date.now() - 3_600_000) } },
  });
  if (recentes >= LIMITE_HORA) {
    return NextResponse.json(
      { erro: "Muitas mensagens na última hora. Respire e tente de novo em alguns minutos." },
      { status: 429 }
    );
  }

  const [historico, contexto] = await Promise.all([
    prisma.mensagem.findMany({
      where: { userId: uid },
      orderBy: { criadaEm: "desc" },
      take: HISTORICO,
      select: { papel: true, conteudo: true },
    }),
    contextoDoUsuario(uid),
  ]);

  await prisma.mensagem.create({
    data: { userId: uid, papel: "user", conteudo: dados.data.mensagem },
  });

  const mensagens: Anthropic.MessageParam[] = historico
    .reverse()
    .map((m): Anthropic.MessageParam => ({
      role: m.papel === "user" ? "user" : "assistant",
      content: m.conteudo,
    }))
    .concat([{ role: "user", content: dados.data.mensagem }]);

  const client = new Anthropic();

  const comum = {
    model: MODELO,
    max_tokens: 16000,
    output_config: { effort: "medium" as const },
    system: [
      { type: "text" as const, text: INSTRUCOES, cache_control: { type: "ephemeral" as const } },
      { type: "text" as const, text: `CONTEXTO AO VIVO DA PESSOA (agora):\n\n${contexto}` },
    ],
    messages: mensagens,
  };

  const encoder = new TextEncoder();
  let resposta = "";

  const corpo = new ReadableStream<Uint8Array>({
    async start(controle) {
      const consumir = async (usarFallback: boolean) => {
        const stream = usarFallback
          ? client.beta.messages.stream({
              ...comum,
              betas: ["server-side-fallback-2026-07-01"],
              fallbacks: "default",
            } as Parameters<typeof client.beta.messages.stream>[0])
          : client.messages.stream(comum);

        for await (const evento of stream) {
          if (evento.type === "content_block_delta" && evento.delta.type === "text_delta") {
            resposta += evento.delta.text;
            controle.enqueue(encoder.encode(evento.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal" && resposta.length === 0) {
          const aviso =
            "Não consegui responder isso agora. Reformula em outras palavras? Se for urgência com você mesmo, liga 188 (CVV, gratuito, 24h) — eu fico aqui.";
          resposta = aviso;
          controle.enqueue(encoder.encode(aviso));
        }
      };

      try {
        try {
          await consumir(true);
        } catch (e) {
          // Se o servidor não aceitar o beta de fallback, refaz sem ele —
          // desde que nada tenha sido enviado ao cliente ainda.
          if (resposta.length > 0) throw e;
          console.warn("[chat] retomando sem server-side fallback:", (e as Error).message);
          await consumir(false);
        }
      } catch (e) {
        console.error("[chat] erro", e);
        const msg =
          "Deu um problema na minha conexão agora. Tenta de novo em alguns segundos — e se a vontade estiver forte, bebe um copo de água gelada de uma vez e sai do cômodo enquanto isso.";
        if (resposta.length === 0) {
          resposta = msg;
          controle.enqueue(encoder.encode(msg));
        }
      } finally {
        if (resposta.trim()) {
          await prisma.mensagem
            .create({ data: { userId: uid, papel: "assistant", conteudo: resposta } })
            .catch(() => {});
        }
        controle.close();
      }
    },
  });

  return new Response(corpo, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
