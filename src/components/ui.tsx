"use client";

import { forwardRef } from "react";

type BotaoProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "cheio" | "vazio" | "perigo" | "fantasma";
  carregando?: boolean;
};

export function Botao({
  variante = "cheio",
  carregando,
  className = "",
  children,
  disabled,
  ...resto
}: BotaoProps) {
  const estilos = {
    cheio:
      "bg-brand text-brand-ink hover:bg-brand-escuro active:bg-brand-escuro font-semibold shadow-lg shadow-brand/20",
    vazio:
      "bg-white/5 text-tinta border border-white/12 hover:bg-white/10 active:bg-white/15",
    perigo:
      "bg-perigo/12 text-perigo border border-perigo/25 hover:bg-perigo/20",
    fantasma: "text-suave hover:text-tinta hover:bg-white/5",
  }[variante];

  return (
    <button
      {...resto}
      disabled={disabled || carregando}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${estilos} ${className}`}
    >
      {carregando && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

export const Campo = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { rotulo?: string; dica?: string }
>(function Campo({ rotulo, dica, className = "", ...resto }, ref) {
  return (
    <label className="block">
      {rotulo && (
        <span className="mb-1.5 block text-[13px] font-medium text-suave">{rotulo}</span>
      )}
      <input
        ref={ref}
        {...resto}
        className={`w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-tinta outline-none transition placeholder:text-fantasma focus:border-brand/50 focus:bg-white/[0.06] ${className}`}
      />
      {dica && <span className="mt-1.5 block text-xs text-apagado">{dica}</span>}
    </label>
  );
});

export function Area({
  rotulo,
  dica,
  className = "",
  ...resto
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { rotulo?: string; dica?: string }) {
  return (
    <label className="block">
      {rotulo && (
        <span className="mb-1.5 block text-[13px] font-medium text-suave">{rotulo}</span>
      )}
      <textarea
        {...resto}
        className={`w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-tinta outline-none transition placeholder:text-fantasma focus:border-brand/50 focus:bg-white/[0.06] ${className}`}
      />
      {dica && <span className="mt-1.5 block text-xs text-apagado">{dica}</span>}
    </label>
  );
}

export function Aviso({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="surge rounded-2xl border border-perigo/25 bg-perigo/10 px-4 py-3 text-sm text-perigo">
      {children}
    </p>
  );
}

export function Chave({
  ligado,
  aoMudar,
  rotulo,
  descricao,
}: {
  ligado: boolean;
  aoMudar: (v: boolean) => void;
  rotulo: string;
  descricao?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => aoMudar(!ligado)}
      className="flex w-full items-center justify-between gap-4 py-3.5 text-left"
    >
      <span className="min-w-0">
        <span className="block text-[15px] text-tinta">{rotulo}</span>
        {descricao && <span className="mt-0.5 block text-[13px] text-apagado">{descricao}</span>}
      </span>
      <span
        className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${
          ligado ? "bg-brand" : "bg-white/12"
        }`}
      >
        <span
          className={`absolute top-[2px] size-[27px] rounded-full bg-white shadow transition-all ${
            ligado ? "left-[22px]" : "left-[2px]"
          }`}
        />
      </span>
    </button>
  );
}
