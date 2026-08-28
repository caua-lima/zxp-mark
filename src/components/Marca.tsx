export function Marca({ tamanho = 44 }: { tamanho?: number }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden>
        <defs>
          <linearGradient id="marca-arco" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c99700" />
            <stop offset="55%" stopColor="#f7c41c" />
            <stop offset="100%" stopColor="#ffe37a" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="36" fill="none" stroke="#292d35" strokeWidth="11" />
        <circle
          cx="50"
          cy="50"
          r="36"
          fill="none"
          stroke="url(#marca-arco)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 36 * 0.78} ${2 * Math.PI * 36}`}
          transform="rotate(-90 50 50)"
        />
        <circle cx="50" cy="50" r="9.5" fill="#f2f4f8" />
      </svg>
      <div>
        <p className="text-[22px] font-semibold leading-none tracking-tight">Marco</p>
        <p className="mt-1 text-[12.5px] text-apagado">Cada hora conta.</p>
      </div>
    </div>
  );
}
