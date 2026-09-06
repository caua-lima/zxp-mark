"use client";

import Link from "next/link";
import { Cronometro } from "@/components/Cronometro";
import { preset, situacao } from "@/lib/habitos";
import { impacto, reais, rotuloMs } from "@/lib/formato";

export type MarcoResumo = {
  id: string;
  titulo: string;
  preset: string;
  emoji: string;
  cicloInicio: string;
  ativo: boolean;
  unidadesPorDia: number | null;
  gastoDiario: number | null;
};

/**
 * Cartão da lista. O progresso e as estatísticas são calculados no servidor
 * (com o `agora` recebido) para não divergir na hidratação; só o cronômetro
 * atualiza a cada segundo.
 */
export function CartaoMarco({ marco, agora }: { marco: MarcoResumo; agora: number }) {
  const decorrido = Math.max(0, agora - new Date(marco.cicloInicio).getTime());
  const p = preset(marco.preset);
  const { proximo, atingidos, progresso } = situacao(marco.preset, decorrido);
  const st = impacto(marco, agora);

  return (
    <Link
      href={`/marcos/${marco.id}`}
      className="cartao surge block p-5 transition-colors active:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="text-xl">{marco.emoji}</span>
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-semibold">{marco.titulo}</h3>
            {p.rotulo !== marco.titulo && (
              <p className="truncate text-[12.5px] text-apagado">{p.rotulo}</p>
            )}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-white/6 px-2.5 py-1 text-[11px] font-medium text-suave">
          {atingidos.length}/{p.marcos.length}
        </span>
      </div>

      <div className="mt-4">
        <Cronometro desde={marco.cicloInicio} tamanho="grande" />
        <p className="mt-1 text-[13px] text-apagado">{p.sufixo}</p>
      </div>

      {proximo && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
            <span className="text-apagado">
              Próximo: <span className="text-suave">{proximo.titulo}</span>
            </span>
            <span className="numeros text-apagado">{rotuloMs(proximo.ms)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-brand-forte transition-[width] duration-1000"
              style={{ width: `${Math.max(2, progresso * 100)}%` }}
            />
          </div>
        </div>
      )}

      {(st.dinheiroEconomizado || st.unidadesEvitadas) && (
        <div className="mt-4 flex gap-4 border-t border-white/6 pt-3 text-[12.5px]">
          {st.dinheiroEconomizado ? (
            <span className="text-suave">
              <span className="numeros font-semibold text-brand">
                {reais(st.dinheiroEconomizado)}
              </span>{" "}
              guardados
            </span>
          ) : null}
          {st.unidadesEvitadas ? (
            <span className="text-suave">
              <span className="numeros font-semibold text-tinta">{st.unidadesEvitadas}</span>{" "}
              {st.unidadeNome} a menos
            </span>
          ) : null}
        </div>
      )}
    </Link>
  );
}
