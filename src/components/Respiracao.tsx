"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Respiração 4-7-8 guiada na tela.
 *
 * É a única coisa que dá para fazer no meio de uma fissura sem sair do
 * aplicativo, e derruba a frequência cardíaca — que é justo o que sobe.
 * Quatro ciclos, cerca de um minuto e meio.
 */

const FASES = [
  { nome: "Inspire", segundos: 4, escala: 1, dica: "pelo nariz" },
  { nome: "Segure", segundos: 7, escala: 1, dica: "sem forçar" },
  { nome: "Solte", segundos: 8, escala: 0.55, dica: "pela boca, devagar" },
] as const;

const CICLOS = 4;

export function Respiracao({ aoFechar }: { aoFechar: () => void }) {
  const [fase, setFase] = useState(0);
  // Anotado como number: o `as const` de FASES fixaria o tipo no literal 4.
  const [restante, setRestante] = useState<number>(FASES[0].segundos);
  const [ciclo, setCiclo] = useState(1);
  const [terminou, setTerminou] = useState(false);

  // Refs para o intervalo não precisar ser recriado a cada segundo.
  const faseRef = useRef(0);
  const cicloRef = useRef(1);

  useEffect(() => {
    const t = setInterval(() => {
      setRestante((s) => {
        if (s > 1) return s - 1;

        const proxima = (faseRef.current + 1) % FASES.length;
        if (proxima === 0) {
          if (cicloRef.current >= CICLOS) {
            setTerminou(true);
            return 0;
          }
          cicloRef.current += 1;
          setCiclo(cicloRef.current);
        }
        faseRef.current = proxima;
        setFase(proxima);
        return FASES[proxima].segundos;
      });
    }, 1000);

    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (terminou) {
      const t = setTimeout(aoFechar, 6000);
      return () => clearTimeout(t);
    }
  }, [terminou, aoFechar]);

  const f = FASES[fase];

  if (terminou) {
    return (
      <div className="cartao surge p-6 text-center">
        <p className="text-[17px] font-semibold text-brand">Pronto.</p>
        <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-suave">
          Quatro ciclos. Se a vontade ainda estiver aí, ela já está mais baixa do que quando você
          começou — repete, ou escreve pra mim o que está acontecendo.
        </p>
        <button
          onClick={aoFechar}
          className="mt-4 rounded-xl border border-borda bg-white/[0.04] px-4 py-2 text-[13px] text-suave"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <div className="cartao surge flex flex-col items-center p-6">
      <div className="flex h-[168px] items-center justify-center">
        <div
          className="flex size-[150px] items-center justify-center rounded-full border-2 border-brand/40 bg-brand/10"
          style={{
            transform: `scale(${f.escala})`,
            transition: `transform ${f.segundos}s ease-in-out`,
          }}
        >
          <span className="numeros text-[40px] font-semibold text-brand">{restante}</span>
        </div>
      </div>

      <p className="mt-4 text-[20px] font-semibold">{f.nome}</p>
      <p className="mt-0.5 text-[13px] text-apagado">{f.dica}</p>

      <div className="mt-4 flex gap-1.5">
        {Array.from({ length: CICLOS }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-6 rounded-full ${i < ciclo ? "bg-brand" : "bg-white/10"}`}
          />
        ))}
      </div>

      <button
        onClick={aoFechar}
        className="mt-4 text-[13px] text-fantasma active:text-suave"
      >
        Parar
      </button>
    </div>
  );
}
