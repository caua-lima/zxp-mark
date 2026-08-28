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
 * Faixa de totais no topo da aba Marcos. Só aparece quando há mais de um
 * marco — com um só, os números já estão no cartão logo abaixo.
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

  const itens: [string, string][] = [
    ["Marcos batidos", String(conquistados)],
    ["Maior sequência", duracaoExtenso(melhor)],
  ];
  if (dinheiro >= 1) itens.unshift(["Economizado", reais(dinheiro)]);

  return (
    <section className="cartao mb-4 flex divide-x divide-borda px-1 py-3.5">
      {itens.map(([rotulo, valor], i) => (
        <div key={rotulo} className="flex-1 px-3 text-center">
          <p
            className={`numeros text-[17px] leading-tight font-semibold ${
              i === 0 && dinheiro >= 1 ? "text-brand" : "text-tinta"
            }`}
          >
            {valor}
          </p>
          <p className="mt-1 text-[10.5px] tracking-wide text-apagado uppercase">{rotulo}</p>
        </div>
      ))}
    </section>
  );
}
