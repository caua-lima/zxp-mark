"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Cronometro } from "@/components/Cronometro";
import { Respiracao } from "@/components/Respiracao";
import { duracaoExtenso } from "@/lib/formato";

export type Msg = { id: string; papel: "user" | "assistant"; conteudo: string };

/** O que o chat sabe sobre a pessoa sem precisar perguntar ao servidor. */
export type Situacao = {
  temMarcos: boolean;
  titulo: string | null;
  emoji: string;
  sufixo: string;
  cicloInicio: string | null;
  proximoTitulo: string | null;
  proximoFaltaMs: number | null;
  temRecaida: boolean;
  contagemTitulo: string | null;
  horas: number;
};

const SOS = "Estou com muita vontade agora. Me ajuda a passar dos próximos 5 minutos.";

/** As sugestões mudam com o estado — nada de lista fixa que não serve pra nada. */
function sugestoesPara(s: Situacao): string[] {
  if (!s.temMarcos) {
    return ["O que esse app faz?", "Como funciona a contagem?", "Quero parar de fumar"];
  }

  const base = ["Estou com muita vontade", "Por que não devo ceder agora?"];

  // Primeiras 72h: é onde a abstinência física aperta.
  if (s.horas < 72) {
    base.push("Quanto tempo dura a vontade?", "O que está acontecendo no meu corpo agora?");
  } else {
    base.push("O que está acontecendo no meu corpo agora?", "Quanto já economizei?");
  }

  if (s.temRecaida) base.push("Qual é o meu gatilho?");
  else base.push("Quanto tempo eu já aguentei?");

  if (s.contagemTitulo) base.push(`Quantos dias faltam para ${s.contagemTitulo.toLowerCase()}?`);

  base.push("Me lembra do meu porquê", "Tô ansioso", "Não consigo dormir");
  return base;
}

export function Chat({ inicial, situacao }: { inicial: Msg[]; situacao: Situacao }) {
  const busca = useSearchParams();
  const [msgs, setMsgs] = useState<Msg[]>(inicial);
  const [texto, setTexto] = useState("");
  const [saindo, setSaindo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [respirando, setRespirando] = useState(false);

  const fim = useRef<HTMLDivElement>(null);
  const jaDisparou = useRef(false);

  const sugestoes = useMemo(() => sugestoesPara(situacao), [situacao]);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length, saindo, respirando]);

  const enviar = useCallback(
    async (conteudo: string) => {
      const limpo = conteudo.trim();
      if (!limpo || ocupado) return;

      setErro("");
      setTexto("");
      setOcupado(true);
      setMsgs((m) => [...m, { id: `u${Date.now()}`, papel: "user", conteudo: limpo }]);

      try {
        const r = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mensagem: limpo }),
        });

        if (!r.ok || !r.body) {
          const dados = await r.json().catch(() => ({}));
          setErro(dados.erro ?? "Não consegui responder agora. Tenta de novo.");
          return;
        }

        const leitor = r.body.getReader();
        const decoder = new TextDecoder();
        let acumulado = "";

        for (;;) {
          const { done, value } = await leitor.read();
          if (done) break;
          acumulado += decoder.decode(value, { stream: true });
          setSaindo(acumulado);
        }

        setMsgs((m) => [...m, { id: `a${Date.now()}`, papel: "assistant", conteudo: acumulado }]);
        setSaindo("");
      } catch {
        setErro("Sem conexão. Verifique a internet e tente de novo.");
      } finally {
        setOcupado(false);
      }
    },
    [ocupado]
  );

  // Atalho SOS: /ajuda?sos=1 já manda o pedido de socorro.
  useEffect(() => {
    if (jaDisparou.current) return;
    if (busca.get("sos") !== "1") return;
    jaDisparou.current = true;
    void enviar(SOS);
  }, [busca, enviar]);

  async function limpar() {
    await fetch("/api/chat/historico", { method: "DELETE" });
    setMsgs([]);
    setErro("");
  }

  const vazio = msgs.length === 0 && !saindo;

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <header className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-apagado">Estou aqui a qualquer hora</p>
          <h1 className="text-[26px] font-semibold tracking-tight">Ajuda</h1>
        </div>
        {msgs.length > 0 && (
          <button onClick={limpar} className="text-[13px] text-fantasma active:text-suave">
            Limpar
          </button>
        )}
      </header>

      {/* O número fica à vista o tempo todo — é o argumento mais forte que existe. */}
      {situacao.cicloInicio && (
        <div className="cartao mb-3 flex items-center gap-3 px-4 py-3">
          <span className="text-lg">{situacao.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold">
              <Cronometro desde={situacao.cicloInicio} tamanho="medio" />
            </div>
            <p className="truncate text-[11.5px] text-apagado">
              {situacao.sufixo}
              {situacao.proximoTitulo && situacao.proximoFaltaMs !== null
                ? ` · ${situacao.proximoTitulo} em ${duracaoExtenso(situacao.proximoFaltaMs)}`
                : ""}
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-3">
        {vazio && <Abertura temMarcos={situacao.temMarcos} />}

        {msgs.map((m) => (
          <Balao key={m.id} papel={m.papel} texto={m.conteudo} />
        ))}

        {saindo && <Balao papel="assistant" texto={saindo} />}

        {ocupado && !saindo && (
          <div className="flex gap-1.5 px-1 py-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-2 animate-bounce rounded-full bg-fantasma"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}

        {respirando && <Respiracao aoFechar={() => setRespirando(false)} />}

        {erro && (
          <p className="rounded-2xl border border-perigo/25 bg-perigo/10 px-4 py-3 text-[13.5px] text-perigo">
            {erro}
          </p>
        )}

        <div ref={fim} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!respirando && (
          <button
            onClick={() => setRespirando(true)}
            className="rounded-full border border-brand/30 bg-brand/10 px-3.5 py-2 text-[13px] font-medium text-brand active:bg-brand/20"
          >
            Respirar 4-7-8
          </button>
        )}
        {vazio &&
          sugestoes.map((s) => (
            <button
              key={s}
              onClick={() => enviar(s)}
              className="rounded-full border border-borda bg-white/[0.04] px-3.5 py-2 text-[13px] text-suave active:bg-white/[0.08]"
            >
              {s}
            </button>
          ))}
      </div>

      {/* barra de escrita, colada acima da tab bar */}
      <div className="area-baixo sticky bottom-0 -mx-5 mt-4 border-t border-white/8 bg-[#10100e]/90 px-5 pt-3 pb-3 backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void enviar(texto);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void enviar(texto);
              }
            }}
            rows={1}
            maxLength={4000}
            placeholder="Escreve o que está sentindo..."
            className="max-h-[140px] flex-1 resize-none rounded-3xl border border-white/10 bg-white/[0.05] px-4 py-3 text-tinta outline-none placeholder:text-fantasma focus:border-brand/40"
          />
          <button
            type="submit"
            disabled={!texto.trim() || ocupado}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink transition-opacity disabled:opacity-30"
            aria-label="Enviar"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

function Balao({ papel, texto }: { papel: "user" | "assistant"; texto: string }) {
  const meu = papel === "user";
  return (
    <div className={`surge flex ${meu ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-3xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
          meu
            ? "rounded-br-lg bg-brand text-brand-ink"
            : "rounded-bl-lg border border-white/8 bg-white/[0.06] text-tinta"
        }`}
      >
        {texto}
      </div>
    </div>
  );
}

function Abertura({ temMarcos }: { temMarcos: boolean }) {
  return (
    <div className="cartao px-5 py-7 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-2xl">
        💬
      </div>
      <h2 className="text-[17px] font-semibold">Fala comigo</h2>
      <p className="mx-auto mt-2 max-w-[17rem] text-[14px] leading-relaxed text-apagado">
        {temMarcos
          ? "Eu sei exatamente há quanto tempo você está firme, o que já economizou e qual é o próximo marco. Pergunta o que quiser — principalmente quando a vontade apertar."
          : "Crie um marco primeiro e eu passo a saber há quanto tempo você está firme. Mas pode conversar comigo já."}
      </p>
    </div>
  );
}
