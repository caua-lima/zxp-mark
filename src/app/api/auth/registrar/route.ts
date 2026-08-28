import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { criarSessao, hashSenha } from "@/lib/auth";

export const runtime = "nodejs";

const Corpo = z.object({
  nome: z.string().trim().min(2, "Diga seu nome").max(80),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(8, "A senha precisa de pelo menos 8 caracteres").max(200),
  timezone: z.string().optional(),
});

export async function POST(req: Request) {
  const dados = Corpo.safeParse(await req.json().catch(() => null));
  if (!dados.success) {
    return NextResponse.json(
      { erro: dados.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }
  const { nome, email, senha, timezone } = dados.data;

  const existe = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existe) {
    return NextResponse.json({ erro: "Já existe uma conta com esse e-mail." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      nome,
      email,
      senhaHash: hashSenha(senha),
      timezone: timezone && timezone.length < 64 ? timezone : "America/Sao_Paulo",
    },
    select: { id: true, nome: true, email: true },
  });

  await criarSessao(user.id);
  return NextResponse.json({ ok: true, user });
}
