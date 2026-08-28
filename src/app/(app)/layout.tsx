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
      {/* pb-28 abre espaço para a tab bar fixa */}
      <div className="area-topo mx-auto max-w-lg px-5 pt-5 pb-28">{children}</div>
      <TabBar />
    </>
  );
}
