import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth";
import { Perfil } from "@/components/Perfil";
import { provedorAtivo } from "@/lib/ia/provedores";
import { prisma } from "@/lib/db";
import { lerPreferenciaSaude } from "@/lib/servicos/preferencias";

export const dynamic = "force-dynamic";

export default async function PaginaPerfil() {
  const u = await usuarioAtual();
  if (!u) redirect("/entrar");

  const ia = provedorAtivo();
  const saude = await lerPreferenciaSaude(prisma, u.id);

  return (
    <Perfil
      motor={{ id: ia.id, rotulo: ia.rotulo, modelo: ia.modelo, gratuito: ia.gratuito }}
      assistenteUsaSaude={saude.assistenteUsaSaude}
      inicial={{
        nome: u.nome,
        email: u.email,
        timezone: u.timezone,
        notifMarcos: u.notifMarcos,
        notifResumoDiario: u.notifResumoDiario,
        notifNoite: u.notifNoite,
        notifFoco: u.notifFoco,
        horaFoco: u.horaFoco,
        horaResumo: u.horaResumo,
        horaNoite: u.horaNoite,
      }}
    />
  );
}
