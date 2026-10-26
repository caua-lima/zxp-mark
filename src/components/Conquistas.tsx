"use client";

import { useState } from "react";
import Link from "next/link";
import { Brilho, Icone, Secao } from "@/components/ui";
import { dataLonga, duracaoExtenso, reais, rotuloMs } from "@/lib/formato";

export type Conquista = {
  marcoId: string;
  marcoTitulo: string;
  emoji: string;
  chave: string;
  titulo: string;
  corpo: string;
  ms: number;
  /** quando o limiar não é tempo (ex.: noites registradas), o texto do selo */
  rotulo?: string;
  em: string;
};

export type ProximaConquista = {
  marcoId: string;
  emoji: string;
  titulo: string;
  faltaMs: number;
  ms: number;
};

export type Recordes = {
  total: number;
  emTentativasAnteriores: number;
  melhorSequenciaMs: number;
  dinheiroTotal: number;
  diasLimpos: number;
  marcosAtivos: number;
};

export function Conquistas({
  conquistas,
  proximas,
  recordes,
}: {
  conquistas: Conquista[];
  proximas: ProximaConquista[];
  recordes: Recordes;
}) {
  return (
    <main>
      <header className="mb-5 flex items-center justify-between gap-3">
        <Link href="/marcos" className="text-[14px] text-apagado active:text-suave">
          ← Marcos
        </Link>
        {conquistas.length > 0 && <Compartilhar conquistas={conquistas} recordes={recordes} />}
      </header>

      <section className="cartao relative mb-3.5 overflow-hidden p-7 text-center">
        <Brilho className="-top-24 left-1/2 size-64 -translate-x-1/2" />
        <p className="relative text-[11px] font-semibold tracking-[0.18em] text-apagado uppercase">
          Etapas conquistadas
        </p>
        <p className="numeros font-display relative mt-3 text-[76px] leading-[0.82] font-extrabold text-brand">
          {recordes.total}
        </p>
        {recordes.emTentativasAnteriores > 0 && (
          <p className="relative mt-3 text-[12.5px] text-apagado">
            + {recordes.emTentativasAnteriores} em tentativas anteriores — elas também contam
          </p>
        )}
      </section>

      <section className="mb-5 grid grid-cols-2 gap-3">
        <Ficha rotulo="Melhor sequência" valor={duracaoExtenso(recordes.melhorSequenciaMs)} />
        <Ficha rotulo="Dias limpos" valor={String(recordes.diasLimpos)} />
        {recordes.dinheiroTotal >= 1 && (
          <Ficha rotulo="Economizado" valor={reais(recordes.dinheiroTotal)} destaque />
        )}
        <Ficha rotulo="Hábitos ativos" valor={String(recordes.marcosAtivos)} />
      </section>

      {proximas.length > 0 && (
        <section className="mb-6">
          <Secao titulo="Chegando" />
          <div className="space-y-2">
            {proximas.map((p) => (
              <div
                key={`${p.marcoId}-${p.titulo}`}
                className="cartao flex items-center gap-3 px-4 py-3.5"
              >
                <Icone tamanho="sm" apagado>
                  {p.emoji}
                </Icone>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-tinta">{p.titulo}</p>
                  <p className="text-[12px] text-apagado">faltam {duracaoExtenso(p.faltaMs)}</p>
                </div>
                <span className="numeros shrink-0 text-[11.5px] text-fantasma">
                  {rotuloMs(p.ms)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Secao titulo={conquistas.length > 0 ? "Tudo que você já conquistou" : "Conquistas"} />

      {conquistas.length === 0 ? (
        <div className="cartao px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand/12 text-2xl">
            🏆
          </div>
          <p className="text-[15px] font-semibold">Ainda nenhuma — por enquanto</p>
          <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-apagado">
            A primeira chega em 20 minutos de sequência. Depois 1 hora, 2 horas, 6 horas. Elas
            aparecem aqui sozinhas.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-0 border-l border-borda pl-5">
          {conquistas.map((c) => (
            <li key={`${c.marcoId}-${c.chave}`} className="relative pb-5">
              <span className="absolute -left-[26px] top-1 size-3 rounded-full bg-brand ring-4 ring-brand/15" />
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[14.5px] font-medium text-tinta">{c.titulo}</h3>
                <span className="numeros shrink-0 text-[11.5px] text-fantasma">
                  {c.rotulo ?? rotuloMs(c.ms)}
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-suave">{c.corpo}</p>
              <p className="mt-2 text-[11.5px] text-brand/75">
                {c.emoji} {c.marcoTitulo} · {dataLonga(c.em)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

function Ficha({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="cartao p-4">
      <p className="text-[10px] font-semibold tracking-[0.1em] text-apagado uppercase">{rotulo}</p>
      <p
        className={`numeros font-display mt-2 text-[19px] leading-tight font-bold ${
          destaque ? "text-brand" : "text-tinta"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function Compartilhar({
  conquistas,
  recordes,
}: {
  conquistas: Conquista[];
  recordes: Recordes;
}) {
  const [estado, setEstado] = useState<"" | "copiado" | "erro">("");

  const texto = [
    `${conquistas[0].emoji} ${conquistas[0].titulo}`,
    recordes.dinheiroTotal >= 1 ? `${reais(recordes.dinheiroTotal)} economizados` : "",
    `${recordes.total} marcos conquistados`,
    "",
    "ZXP Mark",
  ]
    .filter(Boolean)
    .join("\n");

  async function enviar() {
    setEstado("");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Meus marcos", text: texto });
        return;
      }
      await navigator.clipboard.writeText(texto);
      setEstado("copiado");
      setTimeout(() => setEstado(""), 2000);
    } catch {
      // AbortError = o usuário fechou a folha de compartilhamento; não é erro.
    }
  }

  return (
    <button
      onClick={enviar}
      className="flex items-center gap-1.5 rounded-xl border border-borda bg-white/[0.04] px-3.5 py-2 text-[13px] font-medium text-suave active:bg-white/[0.08]"
    >
      {estado === "copiado" ? (
        "Copiado ✓"
      ) : (
        <>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path d="M12 16V4m0 0L8 8m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" strokeLinecap="round" />
          </svg>
          Compartilhar
        </>
      )}
    </button>
  );
}
