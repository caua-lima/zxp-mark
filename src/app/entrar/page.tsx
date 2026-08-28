import { redirect } from "next/navigation";
import { usuarioId } from "@/lib/auth";
import { FormAuth } from "@/components/FormAuth";
import { Marca } from "@/components/Marca";

export const dynamic = "force-dynamic";

export default async function Entrar() {
  if (await usuarioId()) redirect("/marcos");

  return (
    <main className="area-topo area-baixo mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <Marca />
      <h1 className="mt-8 text-[28px] font-semibold leading-tight">Bem-vindo de volta</h1>
      <p className="mt-1.5 mb-7 text-[15px] text-apagado">
        Seu cronômetro não parou enquanto você esteve fora.
      </p>
      <FormAuth modo="entrar" />
    </main>
  );
}
