import Link from "next/link";

export type ModoContagem = "desde" | "regressiva";

export function lerModo(valor: string | string[] | undefined): ModoContagem {
  return valor === "desde" ? "desde" : "regressiva";
}

const OPCOES: { id: ModoContagem; rotulo: string; dica: string }[] = [
  { id: "desde", rotulo: "Desde o início", dica: "tempo corrido" },
  { id: "regressiva", rotulo: "Regressiva", dica: "até uma data" },
];

/**
 * Seletor interno da aba Contagem. É feito de links — a opção escolhida mora na
 * URL (?modo=…), então voltar, recarregar e compartilhar o endereço mantêm a
 * escolha, e funciona por teclado e leitor de tela sem JavaScript.
 */
export function SeletorModo({ modo }: { modo: ModoContagem }) {
  return (
    <nav
      aria-label="Tipo de contagem"
      className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-borda bg-white/[0.03] p-1"
    >
      {OPCOES.map((o) => {
        const ativo = o.id === modo;
        return (
          <Link
            key={o.id}
            href={`/contagem?modo=${o.id}`}
            replace
            aria-current={ativo ? "page" : undefined}
            className={`flex min-h-12 flex-col items-center justify-center rounded-xl px-3 py-2 text-center transition-colors ${
              ativo ? "bg-brand text-brand-ink shadow-md shadow-brand/20" : "text-suave active:bg-white/[0.06]"
            }`}
          >
            <span className="text-[14px] leading-tight font-semibold">{o.rotulo}</span>
            <span className={`text-[11px] leading-tight ${ativo ? "text-brand-ink/70" : "text-fantasma"}`}>
              {o.dica}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
