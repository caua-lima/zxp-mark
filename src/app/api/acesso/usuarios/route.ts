import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashSenha } from "@/lib/auth";
import { exigirAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET() {
  const g = await exigirAdmin();
  if (!g.ok) return NextResponse.json({ erro: g.erro }, { status: g.status });

  const usuarios = await prisma.user.findMany({
    orderBy: [{ admin: "desc" }, { criadoEm: "asc" }],
    select: SELECAO,
  });

  return NextResponse.json({ usuarios, eu: g.id });
}

const Novo = z.object({
  nome: z.string().trim().min(2, "Diga o nome").max(80),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(8, "A senha precisa de pelo menos 8 caracteres").max(200),
  admin: z.boolean().optional(),
  trocarSenha: z.boolean().optional(),
});

export async function POST(req: Request) {
  const g = await exigirAdmin();
  if (!g.ok) return NextResponse.json({ erro: g.erro }, { status: g.status });

  const dados = Novo.safeParse(await req.json().catch(() => null));
  if (!dados.success) {
    return NextResponse.json(
      { erro: dados.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const existe = await prisma.user.findUnique({
    where: { email: dados.data.email },
    select: { id: true },
  });
  if (existe) {
    return NextResponse.json({ erro: "Já existe um acesso com esse e-mail." }, { status: 409 });
  }

  const usuario = await prisma.user.create({
    data: {
      nome: dados.data.nome,
      email: dados.data.email,
      senhaHash: hashSenha(dados.data.senha),
      admin: dados.data.admin ?? false,
      // Por padrão a pessoa troca a senha que o admin definiu no primeiro acesso.
      trocarSenha: dados.data.trocarSenha ?? true,
    },
    select: SELECAO,
  });

  return NextResponse.json({ ok: true, usuario });
}
