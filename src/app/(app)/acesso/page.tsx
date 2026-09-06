import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { Acesso } from "@/components/Acesso";

export const dynamic = "force-dynamic";
export const metadata = { title: "Acesso" };

export default async function PaginaAcesso() {
  const uid = await usuarioId();
  if (!uid) redirect("/entrar");

  const eu = await prisma.user.findUnique({
    where: { id: uid },
    select: { id: true, nome: true, email: true, admin: true, trocarSenha: true },
  });
  if (!eu) redirect("/entrar");

  return <Acesso eu={eu} />;
}
