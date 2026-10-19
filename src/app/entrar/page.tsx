import { redirect } from "next/navigation";
import { usuarioId } from "@/lib/auth";
import { FormAuth } from "@/components/FormAuth";
import { cadastroAberto } from "@/lib/config";
import { prisma } from "@/lib/db";
import { Marca } from "@/components/Marca";
import { Brilho } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Entrar() {
  if (await usuarioId()) redirect("/marcos");
  const aberto = cadastroAberto() || (await prisma.user.count()) === 0;

  return (
    <main className="topo-tela base-tela relative mx-auto flex min-h-dvh max-w-md flex-col justify-center overflow-hidden px-6">
      {/* a marca nasce de um halo: a primeira tela do app tem que ter presença */}
      <Brilho className="-top-24 left-1/2 size-80 -translate-x-1/2" />

      <div className="relative">
        <Marca />
        <h1 className="mt-8 text-[28px] leading-tight font-semibold">Bem-vindo de volta</h1>
        <p className="mt-1.5 mb-7 text-[15px] text-apagado">
          Seu cronômetro não parou enquanto você esteve fora.
        </p>
        <FormAuth modo="entrar" cadastroAberto={aberto} />
      </div>
    </main>
  );
}
