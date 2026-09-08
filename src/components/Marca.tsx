/**
 * Marca do ZXP Mark.
 *
 * O "Z" é o símbolo compartilhado pelos 4 apps da ZXP Solutions: traço
 * (stroke), nunca preenchimento, com a geometria exata da especificação —
 * pontos `30,47 170,47 30,153 170,153`, espessura 34, junção em esquadria,
 * ponta reta. O que muda de um app para outro é só a cor de assinatura, que
 * aqui vem de `--color-brand` (magenta). Nenhum hexadecimal escrito à mão.
 */

const PONTOS = "30,47 170,47 30,153 170,153";

function Traco({ cor }: { cor: string }) {
  return (
    <polyline
      points={PONTOS}
      fill="none"
      stroke={cor}
      strokeWidth="34"
      strokeLinejoin="miter"
      strokeLinecap="butt"
    />
  );
}

/** Só o símbolo, sem contêiner. */
export function MarcaZ({
  tamanho = 44,
  cor = "var(--color-brand)",
  className,
}: {
  tamanho?: number;
  cor?: string;
  className?: string;
}) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="ZXP Mark"
    >
      <Traco cor={cor} />
    </svg>
  );
}

/** Símbolo dentro do contêiner onyx arredondado — a forma do ícone do app. */
export function MarcaIcone({ tamanho = 44 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 200 200" role="img" aria-label="ZXP Mark">
      <rect width="200" height="200" rx="44" fill="var(--color-fundo)" />
      <Traco cor="var(--color-brand)" />
    </svg>
  );
}

/**
 * Lockup do produto, na estrutura do logo horizontal da família: símbolo,
 * "ZXP" na cor de assinatura e a segunda linha em marfim espaçado — o mesmo
 * lugar onde no logo da empresa se lê SOLUTIONS.
 */
export function Marca({ tamanho = 54 }: { tamanho?: number }) {
  return (
    <div className="flex items-center gap-3">
      <MarcaZ tamanho={tamanho} />
      <div>
        <p className="font-display text-[26px] leading-none font-extrabold tracking-tight text-brand">
          ZXP
        </p>
        <p className="assinatura mt-1.5 text-[11px] text-tinta/85">Mark</p>
      </div>
    </div>
  );
}
