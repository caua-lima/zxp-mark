import { redirect } from "next/navigation";
import { usuarioId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const uid = await usuarioId();
  redirect(uid ? "/marcos" : "/entrar");
}
