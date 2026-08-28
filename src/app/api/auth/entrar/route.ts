import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { conferirSenha, criarSessao } from "@/lib/auth";

export const runtime = "nodejs";

const Corpo = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

export async function POST(req: Request) {
  const dados = Corpo.safeParse(await req.json().catch(() => null));
  if (!dados.success) {
    return NextResponse.json(
      { erro: dados.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: dados.data.email },
    select: { id: true, nome: true, email: true, senhaHash: true },
  });

  // Mesma mensagem para e-mail inexistente e senha errada.
  if (!user || !conferirSenha(dados.data.senha, user.senhaHash)) {
    return NextResponse.json({ erro: "E-mail ou senha incorretos." }, { status: 401 });
  }

  await criarSessao(user.id);
  return NextResponse.json({ ok: true, user: { id: user.id, nome: user.nome, email: user.email } });
}
