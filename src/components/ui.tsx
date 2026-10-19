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

/** Escolha de hora cheia (0-23). Usado nas contagens e nas preferências. */
export function SeletorHora({
  rotulo,
  valor,
  aoMudar,
}: {
  rotulo: string;
  valor: number;
  aoMudar: (h: number) => void;
}) {
  return (
    <label className="surge flex items-center justify-between gap-4 py-3.5">
      <span className="text-[14px] text-suave">{rotulo}</span>
      <select
        value={valor}
        onChange={(e) => aoMudar(Number(e.target.value))}
        className="numeros rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-tinta outline-none"
      >
        {Array.from({ length: 24 }, (_, h) => (
          <option key={h} value={h} className="bg-elevado">
            {String(h).padStart(2, "0")}:00
          </option>
        ))}
      </select>
    </label>
  );
}

/* ------------------------- primitivos de layout -------------------------- */

/**
 * Emoji numa caixa com tinta da marca. É o que dá peso ao item numa lista e
 * faz Marcos, Contagens e Conquistas parecerem o mesmo app.
 */
export function Icone({
  children,
  tamanho = "md",
  apagado,
}: {
  children: React.ReactNode;
  tamanho?: "sm" | "md" | "lg";
  apagado?: boolean;
}) {
  const medida = { sm: "size-9 text-base", md: "size-11 text-xl", lg: "size-14 text-2xl" }[tamanho];
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl ${medida} ${
        apagado ? "bg-white/[0.05]" : "bg-brand/12"
      }`}
    >
      {children}
    </span>
  );
}

/** Cabeçalho de seção: rótulo pequeno à esquerda, ação opcional à direita. */
export function Secao({
  titulo,
  acao,
  className = "",
}: {
  titulo: string;
  acao?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-3 flex items-baseline justify-between gap-3 ${className}`}>
      <h2 className="text-[12px] font-semibold tracking-[0.12em] text-apagado uppercase">
        {titulo}
      </h2>
      {acao}
    </div>
  );
}

/**
 * Número grande com rótulo embaixo — o padrão de destaque do app, nascido no
 * cartão de contagem. `aceso` liga a cor da marca.
 */
export function NumeroHeroi({
  valor,
  rotulo,
  aceso = true,
  tamanho = "lg",
}: {
  valor: string;
  rotulo: string;
  aceso?: boolean;
  tamanho?: "md" | "lg";
}) {
  return (
    <div>
      <p
        className={`numeros font-display leading-[0.85] font-extrabold ${
          tamanho === "lg" ? "text-[64px]" : "text-[40px]"
        } ${aceso ? "text-brand" : "text-tinta"}`}
      >
        {valor}
      </p>
      <p className="mt-1.5 text-[11px] font-semibold tracking-[0.18em] text-apagado uppercase">
        {rotulo}
      </p>
    </div>
  );
}

/** Brilho difuso no canto do cartão — profundidade sem desenhar nada. */
export function Brilho({ className = "-top-16 -left-10 size-56" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full bg-brand/10 blur-3xl ${className}`}
    />
  );
}

/**
 * Barra de progresso com percentual opcional à direita. O `sufixo` existe
 * porque "68%" sozinho não diz percentual de quê — "68% do caminho", sim.
 */
export function Progresso({
  fracao,
  rotulo,
  percentual,
  sufixo,
}: {
  fracao: number;
  rotulo?: React.ReactNode;
  percentual?: boolean;
  sufixo?: string;
}) {
  // A barra tem largura mínima para o fiapo aparecer; se o rótulo arredondasse
  // para baixo, ele diria "0%" ao lado de uma barra que já começou.
  const bruto = Math.max(0, Math.min(1, fracao));
  const pct = bruto > 0 ? Math.max(1, Math.round(bruto * 100)) : 0;
  return (
    <div>
      {rotulo && <div className="mb-1.5 text-[12px]">{rotulo}</div>}
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-escuro to-brand transition-[width] duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      {percentual && (
        <p className="numeros mt-1.5 text-right text-[11px] text-fantasma">
          {pct}%{sufixo ? " " + sufixo : ""}
        </p>
      )}
    </div>
  );
}
