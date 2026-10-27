"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buscar } from "@/lib/conhecimento/indice";
import type { Tema } from "@/lib/conhecimento/tipos";

export type ResumoTema = Pick<Tema, "id" | "titulo" | "descricao" | "categoria" | "nomesAlternativos" | "termos" | "padroes" | "status"> & {
  /** o tema tem acompanhamento por registros que a pessoa já começou */
  acompanhando: boolean;
};

const ROTULO: Record<Tema["categoria"], string> = {
  habito: "Hábito",
  medicamento: "Medicamento",
  rotina: "Rotina",
  "bem-estar": "Bem-estar",
};

/** Busca no catálogo, no navegador: o catálogo é pequeno e público, nada sai daqui. */
export function ListaTemas({ temas }: { temas: ResumoTema[] }) {
  const [q, setQ] = useState("");

  const visiveis = useMemo(() => {
    if (!q.trim()) return temas;
    return buscar(q, temas).map((a) => a.tema);
  }, [q, temas]);

  return (
    <div>
      <label className="sr-only" htmlFor="busca-temas">
        Buscar tema
      </label>
      <input
        id="busca-temas"
        type="search"
        inputMode="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar: unhas, escitalopram, sono…"
        className="w-full rounded-2xl border border-borda bg-white/[0.04] px-4 py-3.5 text-[15px] text-tinta placeholder:text-apagado focus:border-brand/60 focus:outline-none"
      />

      <ul className="mt-4 space-y-3">
        {visiveis.map((t) => (
          <li key={t.id}>
            <Link href={`/temas/${t.id}`} className="cartao block p-5 active:bg-white/[0.04]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-semibold tracking-[0.12em] text-brand uppercase">{ROTULO[t.categoria]}</span>
                {t.acompanhando && (
                  <span className="rounded-full bg-brand/12 px-2.5 py-0.5 text-[11px] font-medium text-brand">Acompanhando</span>
                )}
              </div>
              <h2 className="mt-1 text-[17px] font-semibold">{t.titulo}</h2>
              <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-suave">{t.descricao}</p>
            </Link>
          </li>
        ))}
      </ul>

      {visiveis.length === 0 && (
        <p role="status" className="mt-6 text-center text-[14px] leading-relaxed text-apagado">
          Não encontrei esse tema no catálogo. Ele ainda não tem conteúdo com fontes aqui; prefiro dizer isso a inventar.
        </p>
      )}
    </div>
  );
}
