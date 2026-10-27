"use client";

/** Peças pequenas e comuns aos formulários de saúde. */

export type Resposta = { ok: true; dados: Record<string, unknown> } | { ok: false; erro: string; status: number; dados: Record<string, unknown> };

/** Chama a API e devolve sempre um objeto, nunca lança: a tela decide o que mostrar. */
export async function chamar(url: string, metodo: "POST" | "PATCH" | "PUT" | "DELETE", corpo?: unknown): Promise<Resposta> {
  try {
    const r = await fetch(url, {
      method: metodo,
      headers: corpo === undefined ? undefined : { "content-type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
    const dados = ((await r.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
    if (r.ok) return { ok: true, dados };
    return { ok: false, erro: typeof dados.erro === "string" ? dados.erro : "Não consegui salvar.", status: r.status, dados };
  } catch {
    return { ok: false, erro: "Sem conexão. Tente de novo.", status: 0, dados: {} };
  }
}

export function Escala({
  valor,
  aoMudar,
  rotulo,
  pontas,
}: {
  valor: number | null;
  aoMudar: (v: number | null) => void;
  rotulo: string;
  /** o que significam o 1 e o 5, para não deixar a escala sem sentido */
  pontas: [string, string];
}) {
  return (
    <fieldset>
      <legend className="text-[13px] text-suave">{rotulo}</legend>
      <div className="mt-1.5 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={valor === n}
            onClick={() => aoMudar(valor === n ? null : n)}
            className={`numeros flex-1 rounded-xl border py-2.5 text-[15px] transition-colors ${
              valor === n ? "border-brand bg-brand/15 text-brand" : "border-borda bg-white/[0.03] text-suave active:bg-white/[0.08]"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11.5px] text-apagado">
        <span>1 = {pontas[0]}</span>
        <span>5 = {pontas[1]}</span>
      </div>
    </fieldset>
  );
}

export function Opcoes<T extends string>({
  valor,
  aoMudar,
  opcoes,
  rotulo,
}: {
  valor: T | null;
  aoMudar: (v: T | null) => void;
  opcoes: { id: T; rotulo: string }[];
  rotulo: string;
}) {
  return (
    <fieldset>
      <legend className="text-[13px] text-suave">{rotulo}</legend>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={valor === o.id}
            onClick={() => aoMudar(valor === o.id ? null : o.id)}
            className={`rounded-full border px-3.5 py-2 text-[13.5px] transition-colors ${
              valor === o.id ? "border-brand bg-brand/15 text-brand" : "border-borda bg-white/[0.03] text-suave active:bg-white/[0.08]"
            }`}
          >
            {o.rotulo}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Texto({
  valor,
  aoMudar,
  rotulo,
  max,
  placeholder,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  rotulo: string;
  max: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[13px] text-suave">{rotulo}</span>
      <input
        value={valor}
        maxLength={max}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-borda bg-white/[0.04] px-3.5 py-3 text-[15px] text-tinta placeholder:text-apagado focus:border-brand/60 focus:outline-none"
      />
    </label>
  );
}

export function Erro({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-[13px] leading-relaxed text-perigo">
      {children}
    </p>
  );
}

/** "2026-10-27" → "27/10". */
export function diaCurto(dia: string): string {
  const [, m, d] = dia.split("-");
  return m && d ? `${d}/${m}` : dia;
}
