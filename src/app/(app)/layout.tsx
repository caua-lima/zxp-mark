import { redirect } from "next/navigation";
import { sessaoValida } from "@/lib/auth";
import { TabBar } from "@/components/TabBar";
import { RegistrarSW, VerificarAoAbrir } from "@/components/Push";

export const dynamic = "force-dynamic";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  // Cookie bom com usuário apagado mandava a pessoa pra /entrar, que via o
  // mesmo cookie e mandava de volta pra /marcos — um vai-e-vem sem saída.
  if (!(await sessaoValida())) redirect("/entrar");

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
