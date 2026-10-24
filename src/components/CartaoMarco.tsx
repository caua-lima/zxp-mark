"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brilho, Icone, IconeLapis, Progresso } from "@/components/ui";
import { preset, situacao, DIA } from "@/lib/habitos";
import { duracao, impacto, reais, rotuloMs } from "@/lib/formato";

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

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Cronômetro em destaque: os dias dominam e o resto corre pequeno ao lado —
 * o mesmo padrão do cartão de contagem. Renderiza vazio no servidor porque o
 * relógio dele nunca bate com o do celular.
 */
function TempoHeroi({ desde }: { desde: string }) {
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (agora === null) {
    return (
      <div className="pulso">
        <p className="numeros font-display text-[56px] leading-[0.85] font-extrabold text-borda-forte">
          --
        </p>
        <div className="mt-1.5 h-4" />
      </div>
    );
  }

  const t = Math.max(0, agora - new Date(desde).getTime());
  const { d, h, m, s } = duracao(t);

  // Antes de completar um dia o herói são as horas: "0 dias" não motiva.
  const [valor, rotulo] = d > 0 ? [d, d === 1 ? "dia" : "dias"] : [h, h === 1 ? "hora" : "horas"];
  const resto =
    d > 0 ? (
      <>
        {pad(h)}
        <span className="text-fantasma">h</span> {pad(m)}
        <span className="text-fantasma">m</span> {pad(s)}
        <span className="text-fantasma">s</span>
      </>
    ) : (
      <>
        {pad(m)}
        <span className="text-fantasma">m</span> {pad(s)}
        <span className="text-fantasma">s</span>
      </>
    );

  return (
    <div className="flex items-end gap-3">
      <div>
        <p className="numeros font-display text-[56px] leading-[0.85] font-extrabold text-brand">
          {valor}
        </p>
        <p className="mt-1.5 text-[11px] font-semibold tracking-[0.18em] text-apagado uppercase">
          {rotulo}
        </p>
      </div>
      <p className="numeros mb-1 text-[15px] text-suave">{resto}</p>
    </div>
  );
}

/**
 * Cartão da lista. O progresso e as estatísticas vêm calculados do servidor
 * (com o `agora` recebido) para não divergir na hidratação; só o cronômetro
 * atualiza a cada segundo.
 */
export function CartaoMarco({ marco, agora }: { marco: MarcoResumo; agora: number }) {
  const decorrido = Math.max(0, agora - new Date(marco.cicloInicio).getTime());
  const p = preset(marco.preset);
  const { proximo, atingidos, progresso } = situacao(marco.preset, decorrido);
  const st = impacto(marco, agora);

  // Um centavo é o menor valor que `reais()` consegue mostrar; abaixo disso
  // o número existe mas não aparece.
  const temDinheiro = (st.dinheiroEconomizado ?? 0) >= 0.01;
  const temUnidades = (st.unidadesEvitadas ?? 0) >= 1;

  // Primeiras 24h: fase crítica, o cartão acende para marcar isso.
  const inicio = decorrido < DIA;

  return (
    <div className="surge relative">
    <Link
      href={`/marcos/${marco.id}`}
      className={`cartao relative block overflow-hidden p-5 transition-colors active:bg-white/[0.04] ${
        inicio ? "border-brand/30 shadow-[0_0_40px_-14px_var(--color-brand)]" : ""
      }`}
    >
      <Brilho />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Icone>{marco.emoji}</Icone>
            <div className="min-w-0">
              <h3 className="text-[17px] leading-tight font-semibold">{marco.titulo}</h3>
              {p.rotulo !== marco.titulo && (
                <p className="mt-0.5 truncate text-[12.5px] text-apagado">{p.rotulo}</p>
              )}
            </div>
          </div>
          {/* reserva o espaço do selo e do lápis, que ficam fora do Link */}
          <span aria-hidden className="w-[88px] shrink-0" />
        </div>

        <div className="mt-5">
          <TempoHeroi desde={marco.cicloInicio} />
          <p className="mt-2 text-[13px] text-apagado">{p.sufixo}</p>
        </div>

        {proximo && (
          <div className="mt-5">
            <Progresso
              fracao={progresso}
              rotulo={
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-apagado">
                    Próximo: <span className="text-suave">{proximo.titulo}</span>
                  </span>
                  <span className="numeros shrink-0 text-fantasma">{rotuloMs(proximo.ms)}</span>
                </div>
              }
            />
          </div>
        )}

        {/* Centavos e cigarros só entram quando viram número de verdade: nos
            primeiros minutos isso aparecia como "R$ 0,00 guardados", que é
            pior do que não aparecer nada. */}
        {(temDinheiro || temUnidades) && (
          <div className="mt-4 flex gap-5 border-t border-borda pt-3.5 text-[12.5px]">
            {temDinheiro ? (
              <span className="text-apagado">
                <span className="numeros font-semibold text-brand">
                  {reais(st.dinheiroEconomizado ?? 0)}
                </span>{" "}
                guardados
              </span>
            ) : null}
            {temUnidades ? (
              <span className="text-apagado">
                <span className="numeros font-semibold text-tinta">{st.unidadesEvitadas}</span>{" "}
                {st.unidadeNome} a menos
              </span>
            ) : null}
          </div>
        )}
      </div>
    </Link>

    {/* Fora do Link: <a> dentro de <a> é inválido e o toque iria pro lugar errado.
        O contêiner deixa o toque passar para o cartão; só o lápis o captura. */}
    <div className="pointer-events-none absolute top-5 right-5 flex items-center gap-2">
      <span className="numeros rounded-full bg-white/6 px-2.5 py-1 text-[11px] font-medium text-suave">
        {atingidos.length}/{p.marcos.length}
      </span>
      <Link
        href={`/marcos/${marco.id}?editar=1`}
        aria-label={`Editar ${marco.titulo}`}
        className="pointer-events-auto flex size-8 items-center justify-center rounded-full border border-borda bg-white/[0.04] text-suave transition-colors active:bg-white/[0.1]"
      >
        <IconeLapis className="size-3.5" />
      </Link>
    </div>
    </div>
  );
}
