import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { emTexto, retratoDoUsuario } from "@/lib/ia/contexto";
import { sistemaCompleto } from "@/lib/ia/instrucoes";
import { alertaDeCrise, responderLocal } from "@/lib/ia/local";
import { provedorAtivo, transmitir, type Turno } from "@/lib/ia/provedores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Corpo = z.object({ mensagem: z.string().trim().min(1).max(4000) });

const LIMITE_HORA = 120;
const HISTORICO = 20;

export async function POST(req: Request) {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const dados = Corpo.safeParse(await req.json().catch(() => null));
  if (!dados.success) return NextResponse.json({ erro: "Mensagem inválida" }, { status: 400 });
  const pergunta = dados.data.mensagem;

  const recentes = await prisma.mensagem.count({
    where: { userId: uid, papel: "user", criadaEm: { gt: new Date(Date.now() - 3_600_000) } },
  });
  if (recentes >= LIMITE_HORA) {
    return NextResponse.json(
      { erro: "Muitas mensagens na última hora. Respira e volta daqui a pouco — eu não vou a lugar nenhum." },
      { status: 429 }
    );
  }

  const [historico, retrato] = await Promise.all([
    prisma.mensagem.findMany({
      where: { userId: uid },
      orderBy: { criadaEm: "desc" },
      take: HISTORICO,
      select: { papel: true, conteudo: true },
    }),
    retratoDoUsuario(uid),
  ]);
  if (!retrato) return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 });

  await prisma.mensagem.create({ data: { userId: uid, papel: "user", conteudo: pergunta } });

  const turnos: Turno[] = historico
    .reverse()
    .map((m) => ({ papel: m.papel === "user" ? ("user" as const) : ("assistant" as const), conteudo: m.conteudo }))
    .concat([{ papel: "user", conteudo: pergunta }]);

  const provedor = provedorAtivo();
  const encoder = new TextEncoder();
  let resposta = "";

  const corpo = new ReadableStream<Uint8Array>({
    async start(controle) {
      const emitir = (t: string) => {
        resposta += t;
        controle.enqueue(encoder.encode(t));
      };

      /** Motor local: sai em pedaços para dar a sensação de digitação. */
      const local = async () => {
        const texto = responderLocal(retrato, pergunta, { turno: historico.length });
        const pedacos = texto.match(/\S+\s*|\n/g) ?? [texto];
        for (let i = 0; i < pedacos.length; i += 3) {
          emitir(pedacos.slice(i, i + 3).join(""));
          if (i % 12 === 0) await new Promise((ok) => setTimeout(ok, 12));
        }
      };

      try {
        // Sinal de risco tem resposta fixa, venha qual provedor vier: o
        // número do CVV / SAMU precisa aparecer sempre, sem depender de o
        // modelo lembrar dele.
        const crise = alertaDeCrise(pergunta);
        if (crise) {
          emitir(crise);
        } else if (provedor.id === "local") {
          await local();
        } else {
          const sistema = sistemaCompleto(emTexto(retrato));
          try {
            for await (const pedaco of transmitir(provedor, sistema, turnos)) emitir(pedaco);
            // Provedor respondeu vazio (limite diário, filtro, modelo errado).
            if (!resposta.trim()) await local();
          } catch (e) {
            console.warn(`[chat] ${provedor.id} falhou, usando motor local:`, (e as Error).message);
            if (!resposta.trim()) await local();
          }
        }
      } catch (e) {
        console.error("[chat] erro", e);
        if (!resposta.trim()) {
          emitir(
            "Deu um problema aqui agora. Tenta de novo em alguns segundos — e se a vontade estiver forte, bebe um copo de água gelada de uma vez e sai do cômodo enquanto isso."
          );
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
      "x-motor": provedor.id,
      "x-accel-buffering": "no",
    },
  });
}
