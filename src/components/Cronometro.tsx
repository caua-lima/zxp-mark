"use client";

import { useEffect, useState } from "react";
import { duracao } from "@/lib/formato";

/** Relógio compartilhado: um único setInterval para a página inteira. */
const inscritos = new Set<(t: number) => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function usarAgora() {
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    setAgora(Date.now());
    const atualizar = (t: number) => setAgora(t);
    inscritos.add(atualizar);
    if (!timer) timer = setInterval(() => inscritos.forEach((f) => f(Date.now())), 1000);
    return () => {
      inscritos.delete(atualizar);
      if (inscritos.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, []);

  return agora;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Cronômetro ao vivo. Renderiza vazio no servidor e no primeiro paint para
 * evitar divergência de hidratação (o horário do servidor nunca bate com o
 * do celular).
 */
export function Cronometro({
  desde,
  tamanho = "grande",
}: {
  desde: string | Date;
  tamanho?: "grande" | "medio" | "pequeno";
}) {
  const agora = usarAgora();
  const inicio = new Date(desde).getTime();
  const t = agora === null ? null : Math.max(0, agora - inicio);

  if (t === null) {
    return (
      <div
        className={`pulso numeros text-fantasma ${
          tamanho === "grande" ? "text-5xl" : tamanho === "medio" ? "text-3xl" : "text-xl"
        }`}
      >
        --:--:--
      </div>
    );
  }

  const { d, h, m, s } = duracao(t);

  if (tamanho === "pequeno") {
    return (
      <span className="numeros">
        {d > 0 ? `${d}d ` : ""}
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    );
  }

  const grande = tamanho === "grande";

  return (
    <div className="flex items-baseline gap-1.5">
      {d > 0 && (
        <Unidade valor={d} rotulo={d === 1 ? "dia" : "dias"} destaque grande={grande} />
      )}
      <Unidade valor={h} rotulo="h" grande={grande} zero={d > 0} />
      <Unidade valor={m} rotulo="m" grande={grande} zero />
      <Unidade valor={s} rotulo="s" grande={grande} zero atenuar />
    </div>
  );
}

function Unidade({
  valor,
  rotulo,
  grande,
  destaque,
  zero,
  atenuar,
}: {
  valor: number;
  rotulo: string;
  grande: boolean;
  destaque?: boolean;
  zero?: boolean;
  atenuar?: boolean;
}) {
  return (
    <span className={`flex items-baseline ${atenuar ? "text-apagado" : ""}`}>
      <span
        className={`numeros font-semibold ${
          grande ? "text-[2.75rem] leading-none" : "text-2xl leading-none"
        } ${destaque ? "text-brand" : ""}`}
      >
        {zero ? String(valor).padStart(2, "0") : valor}
      </span>
      <span
        className={`ml-0.5 font-medium ${grande ? "text-base" : "text-xs"} ${
          atenuar ? "text-fantasma" : "text-apagado"
        }`}
      >
        {rotulo}
      </span>
    </span>
  );
}

/** Contagem regressiva: dias, horas, minutos e segundos até a data alvo. */
export function Regressiva({ ate }: { ate: string | Date }) {
  const agora = usarAgora();
  const alvo = new Date(ate).getTime();
  const t = agora === null ? null : alvo - agora;

  if (t === null) return <div className="pulso numeros text-3xl text-fantasma">--:--:--</div>;
  if (t <= 0)
    return <div className="text-3xl font-semibold text-brand">É hoje! 🎉</div>;

  const { d, h, m, s } = duracao(t);

  return (
    <div className="flex items-end gap-3">
      <Bloco valor={d} rotulo={d === 1 ? "dia" : "dias"} forte />
      <Bloco valor={h} rotulo="horas" />
      <Bloco valor={m} rotulo="min" />
      <Bloco valor={s} rotulo="seg" />
    </div>
  );
}

function Bloco({ valor, rotulo, forte }: { valor: number; rotulo: string; forte?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={`numeros font-semibold leading-none ${
          forte ? "text-4xl text-brand" : "text-2xl text-tinta"
        }`}
      >
        {forte ? valor : String(valor).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[11px] uppercase tracking-wide text-apagado">{rotulo}</span>
    </div>
  );
}
