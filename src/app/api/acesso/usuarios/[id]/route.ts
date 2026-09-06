import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashSenha } from "@/lib/auth";
import { contarAdmins, exigirAdmin } from "@/lib/admin";

export const runtime = "nodejs";

const SELECAO = {
  id: true,
  nome: true,
  email: true,
  admin: true,
  trocarSenha: true,
  criadoEm: true,
  ultimoAcesso: true,
  _count: { select: { marcos: true, contagens: true, inscricoes: true } },
} as const;

const Patch = z.object({
  nome: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().toLowerCase().email("E-mail inválido").optional(),
  admin: z.boolean().optional(),
  /** Admin define uma senha nova sem precisar saber a antiga. */
  senha: z.string().min(8, "A senha precisa de pelo menos 8 caracteres").max(200).optional(),
  trocarSenha: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin();
  if (!g.ok) return NextResponse.json({ erro: g.erro }, { status: g.status });

  const { id } = await ctx.params;
  const alvo = await prisma.user.findUnique({ where: { id }, select: { id: true, admin: true } });
  if (!alvo) return NextResponse.json({ erro: "Acesso não encontrado" }, { status: 404 });

  const dados = Patch.safeParse(await req.json().catch(() => null));
  if (!dados.success) {
    return NextResponse.json(
      { erro: dados.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  // Tirar o próprio admin — ou o do último admin — tranca todo mundo pra fora.
  if (dados.data.admin === false && alvo.admin && (await contarAdmins()) <= 1) {
    return NextResponse.json(
      { erro: "Este é o último administrador. Promova outro antes de rebaixar este." },
      { status: 400 }
    );
  }

  if (dados.data.email) {
    const ocupado = await prisma.user.findFirst({
      where: { email: dados.data.email, id: { not: id } },
      select: { id: true },
    });
    if (ocupado) {
      return NextResponse.json({ erro: "Esse e-mail já está em uso." }, { status: 409 });
    }
  }

  const { senha, ...resto } = dados.data;
  const usuario = await prisma.user.update({
    where: { id },
    data: {
      ...resto,
      ...(senha
        ? { senhaHash: hashSenha(senha), trocarSenha: dados.data.trocarSenha ?? id !== g.id }
        : {}),
    },
    select: SELECAO,
  });

  return NextResponse.json({ ok: true, usuario });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin();
  if (!g.ok) return NextResponse.json({ erro: g.erro }, { status: g.status });

  const { id } = await ctx.params;
  if (id === g.id) {
    return NextResponse.json(
      { erro: "Você não pode apagar o seu próprio acesso enquanto está usando ele." },
      { status: 400 }
    );
  }

  const alvo = await prisma.user.findUnique({ where: { id }, select: { admin: true } });
  if (!alvo) return NextResponse.json({ erro: "Acesso não encontrado" }, { status: 404 });

  if (alvo.admin && (await contarAdmins()) <= 1) {
    return NextResponse.json({ erro: "Este é o último administrador." }, { status: 400 });
  }

  // Cascade leva marcos, recaídas, contagens, conversas e inscrições junto.
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
