"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/marcos", rotulo: "Marcos", icone: Chama },
  { href: "/contagem", rotulo: "Contagem", icone: Calendario },
  { href: "/ajuda", rotulo: "Ajuda", icone: Balao },
  { href: "/perfil", rotulo: "Perfil", icone: Pessoa },
];

export function TabBar() {
  const caminho = usePathname();

  return (
    <nav className="area-baixo fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-[#0c0d10]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg">
        {ABAS.map((aba) => {
          const ativa = caminho === aba.href || caminho.startsWith(`${aba.href}/`);
          const Icone = aba.icone;
          return (
            <Link
              key={aba.href}
              href={aba.href}
              className={`flex flex-1 flex-col items-center gap-1 pt-2.5 pb-2 transition-colors ${
                ativa ? "text-brand" : "text-apagado"
              }`}
            >
              <Icone ativa={ativa} />
              <span className="text-[10px] font-medium tracking-wide">{aba.rotulo}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

type IconeProps = { ativa: boolean };
const comum = "size-6";

function Chama({ ativa }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" className={comum} fill={ativa ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7">
      <path d="M12 2.5c.6 3.2 2.4 4.2 3.8 5.9A7.5 7.5 0 0 1 17.5 13a5.5 5.5 0 0 1-11 0c0-1.6.6-2.9 1.4-4 .3 1 .9 1.7 1.7 2 .2-3.1 1.3-5.7 2.4-8.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function Calendario({ ativa }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" className={comum} fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="5" width="18" height="16" rx="3.5" fill={ativa ? "currentColor" : "none"} fillOpacity="0.2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
      {ativa && <circle cx="12" cy="15.5" r="2" fill="currentColor" stroke="none" />}
    </svg>
  );
}

function Balao({ ativa }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" className={comum} fill={ativa ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7">
      <path d="M20.5 11.5c0 4.1-3.8 7.4-8.5 7.4-1 0-2-.15-2.9-.42L4 20.5l1.4-3.7A7 7 0 0 1 3.5 11.5C3.5 7.4 7.3 4.1 12 4.1s8.5 3.3 8.5 7.4Z" strokeLinejoin="round" />
    </svg>
  );
}

function Pessoa({ ativa }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" className={comum} fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8.5" r="3.8" fill={ativa ? "currentColor" : "none"} fillOpacity="0.25" />
      <path d="M4.5 20c.7-3.7 3.8-5.8 7.5-5.8s6.8 2.1 7.5 5.8" strokeLinecap="round" />
    </svg>
  );
}
