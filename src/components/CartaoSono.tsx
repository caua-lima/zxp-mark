import Link from "next/link";
import { Brilho, Icone } from "@/components/ui";
import { formatarDuracao, type ResumoSono } from "@/lib/sono";

/**
 * Atalho para o sono dentro de Marcos — o sono NÃO ganha aba própria. Mostra só
 * o que existe: sem registro ele convida, e nunca exibe "0 horas".
 */
export function CartaoSono({
  ultimaDuracaoMs,
  resumo,
}: {
  ultimaDuracaoMs: number | null;
  resumo: ResumoSono;
}) {
  const vazio = ultimaDuracaoMs === null;

  return (
    <Link
      href="/sono"
      className="cartao relative mb-4 flex items-center gap-3.5 overflow-hidden p-4 transition-colors active:bg-white/[0.04]"
    >
      <Brilho className="-top-16 -left-10 size-44" />
      <Icone>🌙</Icone>
      <div className="relative min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-tinta">Sono</p>
        <p className="mt-0.5 text-[13px] leading-snug text-apagado">
          {vazio
            ? "Registre como foi a sua noite."
            : resumo.mediaMs !== null
              ? `Última: ${formatarDuracao(ultimaDuracaoMs)} · média ${formatarDuracao(resumo.mediaMs)} em ${resumo.noitesRegistradas} ${resumo.noitesRegistradas === 1 ? "noite" : "noites"}`
              : `Última: ${formatarDuracao(ultimaDuracaoMs)}`}
        </p>
      </div>
      <span className="relative text-fantasma" aria-hidden>
        ›
      </span>
    </Link>
  );
}
