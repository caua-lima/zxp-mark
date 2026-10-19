import { preset, situacao } from "@/lib/habitos";
import { duracaoExtenso, impacto, reais } from "@/lib/formato";

type Entrada = {
  preset: string;
  cicloInicio: Date;
  melhorMs: number;
  unidadesPorDia: number | null;
  gastoDiario: number | null;
};

/**
 * Faixa de totais no topo da aba Marcos. Só aparece com mais de um marco —
 * com um só, os números já estão no cartão logo abaixo.
 */
export function ResumoGeral({ marcos, agora }: { marcos: Entrada[]; agora: number }) {
  if (marcos.length < 2) return null;

  let dinheiro = 0;
  let conquistados = 0;
  let melhor = 0;

  for (const m of marcos) {
    const decorrido = Math.max(0, agora - m.cicloInicio.getTime());
    const st = impacto(
      {
        preset: m.preset,
        cicloInicio: m.cicloInicio,
        unidadesPorDia: m.unidadesPorDia,
        gastoDiario: m.gastoDiario,
      },
      agora
    );
    dinheiro += st.dinheiroEconomizado ?? 0;
    conquistados += situacao(m.preset, decorrido).atingidos.length;
    melhor = Math.max(melhor, decorrido, m.melhorMs);
    void preset(m.preset);
  }

  const itens: [string, string, boolean][] = [
    ["Marcos batidos", String(conquistados), false],
    ["Maior sequência", duracaoExtenso(melhor), false],
  ];
  if (dinheiro >= 1) itens.unshift(["Economizado", reais(dinheiro), true]);

  return (
    <section className="cartao relative mb-4 flex overflow-hidden px-1 py-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 size-48 -translate-x-1/2 rounded-full bg-brand/8 blur-3xl"
      />
      {itens.map(([rotulo, valor, destaque], i) => (
        <div
          key={rotulo}
          className={`relative flex-1 px-3 text-center ${i > 0 ? "border-l border-borda" : ""}`}
        >
          <p
            className={`numeros font-display text-[18px] leading-tight font-bold ${
              destaque ? "text-brand" : "text-tinta"
            }`}
          >
            {valor}
          </p>
          <p className="mt-1 text-[10px] font-semibold tracking-[0.1em] text-apagado uppercase">
            {rotulo}
          </p>
        </div>
      ))}
    </section>
  );
}
