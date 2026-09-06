import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { conferirSenha, hashSenha, usuarioId } from "@/lib/auth";

export const runtime = "nodejs";

const Corpo = z.object({
  senhaAtual: z.string().min(1, "Informe a senha atual"),
  senhaNova: z.string().min(8, "A senha nova precisa de pelo menos 8 caracteres").max(200),
});

/** Troca da própria senha. Exige a atual — senão um cookie roubado vira conta roubada. */
export async function PATCH(req: Request) {
  const uid = await usuarioId();
  if (!uid) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const dados = Corpo.safeParse(await req.json().catch(() => null));
  if (!dados.success) {
    return NextResponse.json(
      { erro: dados.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const u = await prisma.user.findUnique({ where: { id: uid }, select: { senhaHash: true } });
  if (!u) return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 });

  if (!conferirSenha(dados.data.senhaAtual, u.senhaHash)) {
    return NextResponse.json({ erro: "Senha atual incorreta." }, { status: 400 });
  }
  if (conferirSenha(dados.data.senhaNova, u.senhaHash)) {
    return NextResponse.json({ erro: "A senha nova é igual à atual." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: uid },
    data: { senhaHash: hashSenha(dados.data.senhaNova), trocarSenha: false },
  });

  return NextResponse.json({ ok: true });
}
