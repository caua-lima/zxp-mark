"use client";

import { useEffect, useRef, useState } from "react";
import { Brilho } from "@/components/ui";
import type { CelebracaoPainel } from "@/lib/painel-progresso";
import type { TipoProgresso } from "@/lib/progressao";

/** Faíscas em leque: posições fixas, sem aleatório, para o render ser estável. */
const FAISCAS = Array.from({ length: 12 }, (_, i) => {
  const angulo = (-Math.PI * 0.95) + (i / 11) * (Math.PI * 0.9);
  const alcance = 70 + (i % 3) * 22;
  return {
    dx: Math.round(Math.cos(angulo) * alcance),
    dy: Math.round(Math.sin(angulo) * alcance) - 20,
    atraso: (i % 4) * 90,
  };
});

/**
 * Celebração de uma etapa nova.
 *
 *   grande   → só etapa relevante (dia, semana, mês...): modal com halo e faíscas.
 *   discreta → o resto: um aviso curto no topo que some sozinho.
 *
 * Marcar como vista acontece quando ela APARECE, não quando é fechada: se a
 * pessoa recarregar a página com o modal aberto, ele não volta. A chamada é
 * idempotente no servidor, então StrictMode, duas abas ou toque duplo não
 * duplicam nada.
 */
export function Celebracao({
  celebracao,
  tipo,
  refId,
  pendentes,
}: {
  celebracao: CelebracaoPainel;
  tipo: TipoProgresso;
  refId: string;
  pendentes: string[];
}) {
  const [aberta, setAberta] = useState(true);
  const botao = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    void fetch("/api/progresso/visto", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tipo, refId, chaves: pendentes }),
    }).catch(() => {
      // Sem rede, a etapa só vai aparecer de novo na próxima visita — melhor que perder.
    });
  }, [tipo, refId, pendentes]);

  useEffect(() => {
    if (!aberta) return;
    if (celebracao.nivel === "grande") {
      botao.current?.focus();
      const tecla = (e: KeyboardEvent) => {
        if (e.key === "Escape") setAberta(false);
        // O modal tem um único controle: o Tab não pode escapar para a página atrás.
        if (e.key === "Tab") {
          e.preventDefault();
          botao.current?.focus();
        }
      };
      window.addEventListener("keydown", tecla);
      return () => window.removeEventListener("keydown", tecla);
    }
    const t = setTimeout(() => setAberta(false), 6000);
    return () => clearTimeout(t);
  }, [aberta, celebracao.nivel]);

  if (!aberta) return null;

  if (celebracao.nivel === "discreta") {
    return (
      <div
        role="status"
        className="aviso-topo topo-tela pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-5 pt-3"
      >
        <div className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border border-brand/30 bg-superficie/95 px-4 py-3 shadow-lg shadow-black/40 backdrop-blur">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink" aria-hidden>
            ✓
          </span>
          <p className="text-[13.5px] leading-snug text-tinta">
            <span className="font-semibold">Nova etapa:</span> {celebracao.titulo}
          </p>
          <button
            type="button"
            onClick={() => setAberta(false)}
            aria-label="Fechar aviso"
            className="-mr-1 ml-1 flex size-8 shrink-0 items-center justify-center rounded-full text-suave active:bg-white/10"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebracao-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-fundo/80 px-6 backdrop-blur-sm"
    >
      <div className="surge cartao relative w-full max-w-sm overflow-hidden p-8 text-center shadow-[0_0_80px_-20px_var(--color-brand)]">
        <Brilho className="-top-24 left-1/2 size-72 -translate-x-1/2" />
        <div className="halo pointer-events-none absolute top-[38%] left-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/15 blur-2xl" aria-hidden />
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {FAISCAS.map((f, i) => (
            <span
              key={i}
              className="faisca"
              style={
                {
                  "--dx": `${f.dx}px`,
                  "--dy": `${f.dy}px`,
                  animationDelay: `${f.atraso}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <div className="relative">
          <div className="desbloqueia mx-auto flex size-16 items-center justify-center rounded-full bg-brand text-brand-ink shadow-lg shadow-brand/40" aria-hidden>
            <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </div>

          <p className="mt-5 text-[11px] font-semibold tracking-[0.18em] text-apagado uppercase">
            Nova etapa
          </p>
          <h2 id="celebracao-titulo" className="font-display mt-2 text-[26px] leading-tight font-extrabold text-brand">
            {celebracao.titulo}
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-suave">{celebracao.mensagem}</p>
          {celebracao.outras > 0 && (
            <p className="mt-2 text-[12.5px] text-apagado">
              {celebracao.outras === 1
                ? "E mais uma etapa também foi alcançada."
                : `E mais ${celebracao.outras} etapas também foram alcançadas.`}
            </p>
          )}

          <button
            ref={botao}
            type="button"
            onClick={() => setAberta(false)}
            className="mt-6 w-full rounded-2xl bg-brand px-5 py-3.5 text-[15px] font-semibold text-brand-ink shadow-lg shadow-brand/20 transition-colors active:bg-brand-escuro"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
