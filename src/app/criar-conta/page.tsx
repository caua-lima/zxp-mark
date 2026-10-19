import { redirect } from "next/navigation";
import { sessaoValida } from "@/lib/auth";
import { cadastroAberto } from "@/lib/config";
import { prisma } from "@/lib/db";
import { FormAuth } from "@/components/FormAuth";
import { Marca } from "@/components/Marca";
import { Brilho, Icone } from "@/components/ui";

export const dynamic = "force-dynamic";

const PROMESSAS = [
  ["⏱️", "O cronômetro nunca para", "Cada hora que você segura firme fica registrada."],
  ["🔔", "Aviso a cada marco", "1h, 6h, 3 dias, 1 mês — chega no seu celular, mesmo com o app fechado."],
  ["💬", "Alguém quando bater a vontade", "Um chat que sabe há quanto tempo você está limpo e o que fazer nos próximos 5 minutos."],
];

export default async function CriarConta() {
  if (await sessaoValida()) redirect("/marcos");
  if (!cadastroAberto() && (await prisma.user.count()) > 0) redirect("/entrar");

  return (
    <main className="topo-tela base-tela relative mx-auto flex min-h-dvh max-w-md flex-col justify-center overflow-hidden px-6">
      <Brilho className="-top-24 left-1/2 size-80 -translate-x-1/2" />

      <div className="relative">
        <Marca />

        <h1 className="mt-8 text-[28px] leading-tight font-semibold">
          Comece a contar
          <br />
          <span className="text-brand">a partir de agora.</span>
        </h1>

        <ul className="mt-6 mb-7 space-y-3">
          {PROMESSAS.map(([icone, titulo, texto]) => (
            <li key={titulo} className="flex items-start gap-3">
              <Icone tamanho="sm">{icone}</Icone>
              <span className="min-w-0 pt-0.5">
                <span className="block text-[14.5px] font-medium text-tinta">{titulo}</span>
                <span className="block text-[13px] leading-snug text-apagado">{texto}</span>
              </span>
            </li>
          ))}
        </ul>

        <FormAuth modo="criar" />
      </div>
    </main>
  );
}
