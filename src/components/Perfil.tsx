"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao, Chave } from "@/components/ui";
import { CartaoNotificacoes } from "@/components/Push";
import { MarcaZ } from "@/components/Marca";

export type Preferencias = {
  nome: string;
  email: string;
  timezone: string;
  notifMarcos: boolean;
  notifResumoDiario: boolean;
  notifNoite: boolean;
  horaResumo: number;
  horaNoite: number;
};

export type Motor = { id: string; rotulo: string; modelo: string; gratuito: boolean };

export function Perfil({ inicial, motor }: { inicial: Preferencias; motor: Motor }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(inicial);
  const [salvo, setSalvo] = useState(false);

  async function atualizar(patch: Partial<Preferencias>) {
    const antes = prefs;
    setPrefs((p) => ({ ...p, ...patch }));
    const r = await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!r.ok) {
      setPrefs(antes);
      return;
    }
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1600);
  }

  async function sair() {
    await fetch("/api/auth/sair", { method: "POST" });
    // As páginas guardadas para uso offline são de uma conta só — apaga.
    navigator.serviceWorker?.controller?.postMessage({ tipo: "limpar-cache" });
    router.replace("/entrar");
    router.refresh();
  }

  const fusoDoAparelho = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fusoDiferente = fusoDoAparelho && fusoDoAparelho !== prefs.timezone;

  return (
    <main className="space-y-3.5">
      <header className="mb-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[26px] font-semibold tracking-tight">{prefs.nome}</h1>
          <p className="truncate text-[13px] text-apagado">{prefs.email}</p>
        </div>
        {salvo && <span className="surge shrink-0 text-[12px] text-brand">salvo ✓</span>}
      </header>

      <CartaoNotificacoes />

      <CartaoMotor motor={motor} />

      <section className="cartao px-5 py-2">
        <div className="divide-y divide-white/6">
          <Chave
            ligado={prefs.notifMarcos}
            aoMudar={(v) => atualizar({ notifMarcos: v })}
            rotulo="Avisar a cada marco"
            descricao="1h, 6h, 3 dias, 1 mês... no instante em que você bate."
          />
          <Chave
            ligado={prefs.notifResumoDiario}
            aoMudar={(v) => atualizar({ notifResumoDiario: v })}
            rotulo="Resumo da manhã"
            descricao="Onde você está e qual é o próximo marco."
          />
          {prefs.notifResumoDiario && (
            <SeletorHora
              rotulo="Horário do resumo"
              valor={prefs.horaResumo}
              aoMudar={(h) => atualizar({ horaResumo: h })}
            />
          )}
          <Chave
            ligado={prefs.notifNoite}
            aoMudar={(v) => atualizar({ notifNoite: v })}
            rotulo="Fecho da noite"
            descricao="Um empurrão antes de dormir."
          />
          {prefs.notifNoite && (
            <SeletorHora
              rotulo="Horário da noite"
              valor={prefs.horaNoite}
              aoMudar={(h) => atualizar({ horaNoite: h })}
            />
          )}
        </div>
      </section>

      <section className="cartao p-5">
        <h2 className="text-[15px] font-semibold">Fuso horário</h2>
        <p className="mt-1 text-[13px] text-apagado">
          Usado para saber que horas são aí quando eu te aviso.
        </p>
        <p className="numeros mt-3 text-[14px] text-tinta">{prefs.timezone}</p>
        {fusoDiferente && (
          <button
            onClick={() => atualizar({ timezone: fusoDoAparelho })}
            className="mt-3 rounded-xl border border-brand/30 bg-brand/10 px-3.5 py-2 text-[13px] font-medium text-brand"
          >
            Usar o do aparelho ({fusoDoAparelho})
          </button>
        )}
      </section>

      <section className="cartao divide-y divide-borda px-5">
        <a
          href="/conquistas"
          className="flex items-center justify-between gap-3 py-4 text-[15px] text-tinta"
        >
          <span className="flex items-center gap-2.5">🏆 Minhas conquistas</span>
          <span className="text-apagado">›</span>
        </a>
        <a
          href="/api/exportar"
          className="flex items-center justify-between gap-3 py-4 text-[15px] text-tinta"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-2.5">💾 Baixar meus dados</span>
            <span className="mt-0.5 block text-[12.5px] text-apagado">
              Marcos, recaídas, contagens e conversas em JSON
            </span>
          </span>
          <span className="text-apagado">›</span>
        </a>
      </section>

      <Botao variante="vazio" onClick={sair} className="w-full">
        Sair da conta
      </Botao>

      <div className="flex flex-col items-center gap-2 pt-6 pb-2">
        <MarcaZ tamanho={22} cor="#7a766c" />
        <p className="assinatura text-[9px] text-fantasma">ZXP Solutions</p>
        <p className="mt-2 text-center text-[12px] leading-relaxed text-fantasma">
          O ZXP Mark não substitui médico, psicólogo ou psiquiatra.
          <br />
          Se precisar de ajuda agora: CVV — 188, gratuito, 24 horas.
        </p>
      </div>
    </main>
  );
}

function CartaoMotor({ motor }: { motor: Motor }) {
  const local = motor.id === "local";
  return (
    <section className="cartao p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">Motor da aba Ajuda</h2>
          <p className="mt-1 text-[13px] text-apagado">{motor.rotulo}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
            motor.gratuito ? "bg-sucesso/15 text-sucesso" : "bg-brand/15 text-brand"
          }`}
        >
          {motor.gratuito ? "Grátis" : "Pago"}
        </span>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-suave">
        {local
          ? "Rodando sem nenhuma API: as respostas são montadas aqui mesmo, com os seus números reais. Nunca falha e nunca cobra. Para deixar a conversa mais natural, dá para ligar um provedor com nível gratuito (Groq ou Google Gemini) nas variáveis de ambiente."
          : `Conversa gerada por ${motor.rotulo} (${motor.modelo}). Se esse provedor cair ou bater o limite diário, o motor local assume na hora — a conversa não para.`}
      </p>
    </section>
  );
}

function SeletorHora({
  rotulo,
  valor,
  aoMudar,
}: {
  rotulo: string;
  valor: number;
  aoMudar: (h: number) => void;
}) {
  return (
    <label className="surge flex items-center justify-between gap-4 py-3.5">
      <span className="text-[14px] text-suave">{rotulo}</span>
      <select
        value={valor}
        onChange={(e) => aoMudar(Number(e.target.value))}
        className="numeros rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-tinta outline-none"
      >
        {Array.from({ length: 24 }, (_, h) => (
          <option key={h} value={h} className="bg-[#21211f]">
            {String(h).padStart(2, "0")}:00
          </option>
        ))}
      </select>
    </label>
  );
}
