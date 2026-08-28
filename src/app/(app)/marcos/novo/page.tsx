import Link from "next/link";
import { FormMarco } from "@/components/FormMarco";

export default function NovoMarco() {
  return (
    <main>
      <header className="mb-6">
        <Link href="/marcos" className="text-[14px] text-apagado active:text-suave">
          ← Voltar
        </Link>
        <h1 className="mt-3 text-[26px] font-semibold tracking-tight">Novo marco</h1>
        <p className="mt-1 text-[14px] text-apagado">
          A partir do momento em que você salvar, o relógio corre.
        </p>
      </header>
      <FormMarco />
    </main>
  );
}
