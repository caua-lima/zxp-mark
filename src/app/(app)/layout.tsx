import { redirect } from "next/navigation";
import { usuarioId } from "@/lib/auth";
import { TabBar } from "@/components/TabBar";
import { RegistrarSW, VerificarAoAbrir } from "@/components/Push";

export const dynamic = "force-dynamic";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  if (!(await usuarioId())) redirect("/entrar");

  return (
    <>
      <RegistrarSW />
      <VerificarAoAbrir />
      {/* base-app abre espaço para a tab bar fixa e para o indicador de início */}
      <div className="topo-app base-app mx-auto max-w-lg px-5">{children}</div>
      <TabBar />
    </>
  );
}
