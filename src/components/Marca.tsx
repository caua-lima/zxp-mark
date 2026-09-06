/**
 * Marca do app. O Z é o traçado oficial da ZXP Solutions, copiado do
 * public/marca/icone-transparente-dourado.svg — mesmos pontos, mesma
 * espessura, mesmas junções em esquadria.
 */

export function MarcaZ({
  tamanho = 44,
  cor = "#F4B942",
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
      aria-label="ZXP Solutions"
    >
      <polyline
        points="30,47 170,47 30,153 170,153"
        fill="none"
        stroke={cor}
        strokeWidth="34"
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
    </svg>
  );
}

/** Z dentro do quadrado onyx arredondado, como no ícone do app. */
export function MarcaIcone({ tamanho = 44 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 200 200" role="img" aria-label="ZXP Solutions">
      <rect width="200" height="200" rx="44" fill="#10100E" />
      <g transform="translate(24,24) scale(0.76)">
        <polyline
          points="30,47 170,47 30,153 170,153"
          fill="none"
          stroke="#F4B942"
          strokeWidth="34"
          strokeLinejoin="miter"
          strokeLinecap="butt"
        />
      </g>
    </svg>
  );
}

/**
 * Lockup do produto: o Z da ZXP, o nome do app e a assinatura da empresa —
 * a mesma hierarquia do logo horizontal oficial.
 */
export function Marca({ tamanho = 54 }: { tamanho?: number }) {
  return (
    // Mesma estrutura do logo-horizontal oficial: Z inteiro (o quadrado só
    // existe no ícone do app), "ZXP" em dourado 800 e a segunda linha em
    // marfim espaçado — onde no logo da empresa se lê SOLUTIONS.
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
