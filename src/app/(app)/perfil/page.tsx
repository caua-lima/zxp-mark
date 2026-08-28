import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth";
import { Perfil } from "@/components/Perfil";

export const dynamic = "force-dynamic";

export default async function PaginaPerfil() {
  const u = await usuarioAtual();
  if (!u) redirect("/entrar");

  return (
    <Perfil
      inicial={{
        nome: u.nome,
        email: u.email,
        timezone: u.timezone,
        notifMarcos: u.notifMarcos,
        notifResumoDiario: u.notifResumoDiario,
        notifNoite: u.notifNoite,
        horaResumo: u.horaResumo,
        horaNoite: u.horaNoite,
      }}
    />
  );
}
