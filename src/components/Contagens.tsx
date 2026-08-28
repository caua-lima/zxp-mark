"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Area, Aviso, Botao, Campo } from "@/components/ui";
import { Regressiva } from "@/components/Cronometro";
import { dataLonga } from "@/lib/formato";

export type Contagem = {
  id: string;
  titulo: string;
  emoji: string;
  descricao: string | null;
  alvo: string;
  criadoEm: string;
  avisos: number[];
  notificar: boolean;
};

const EMOJIS = ["🎯", "✈️", "🏖️", "🎂", "💍", "🏠", "🎓", "🚗", "🎄", "💼", "🏆", "❤️"];
const OPCOES_AVISO = [90, 60, 30, 14, 7, 3, 1, 0];

export function Contagens({ inicial, agora }: { inicial: Contagem[]; agora: number }) {
  const router = useRouter();
  const [criando, setCriando] = useState(inicial.length === 0);

  const futuras = inicial.filter((c) => new Date(c.alvo).getTime() > agora);
  const passadas = inicial.filter((c) => new Date(c.alvo).getTime() <= agora);

  return (
    <main>
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-apagado">O que você está esperando</p>
          <h1 className="text-[26px] font-semibold tracking-tight">Contagens</h1>
        </div>
        <button
          onClick={() => setCriando((v) => !v)}
          className="flex size-11 items-center justify-center rounded-full bg-brand text-2xl font-light text-brand-ink shadow-lg shadow-brand/20 active:bg-brand-forte"
          aria-label={criando ? "Fechar" : "Nova contagem"}
        >
          {criando ? "×" : "+"}
        </button>
      </header>

      {criando && (
        <FormContagem
          aoSalvar={() => {
            setCriando(false);
            router.refresh();
          }}
        />
      )}

      {futuras.length === 0 && !criando && (
        <div className="cartao px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-2xl">
            🎯
          </div>
          <h2 className="text-[17px] font-semibold">Nada marcado ainda</h2>
          <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-apagado">
            Viagem, aniversário, prova, mudança. Marca a data e eu conto os dias por você — com
            aviso quando estiver chegando.
          </p>
        </div>
      )}

      <div className="space-y-3.5">
        {futuras.map((c) => (
          <CartaoContagem key={c.id} contagem={c} agora={agora} aoMudar={() => router.refresh()} />
        ))}
      </div>

      {passadas.length > 0 && (
        <>
          <h2 className="mt-7 mb-3 text-[13px] font-medium text-apagado">Já aconteceram</h2>
          <div className="space-y-3.5 opacity-60">
            {passadas.map((c) => (
              <CartaoContagem
                key={c.id}
                contagem={c}
                agora={agora}
                aoMudar={() => router.refresh()}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function CartaoContagem({
  contagem,
  agora,
  aoMudar,
}: {
  contagem: Contagem;
  agora: number;
  aoMudar: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const alvo = new Date(contagem.alvo).getTime();
  const criado = new Date(contagem.criadoEm).getTime();
  const total = Math.max(1, alvo - criado);
  const progresso = Math.max(0, Math.min(1, (agora - criado) / total));

  async function excluir() {
    setOcupado(true);
    await fetch(`/api/contagens/${contagem.id}`, { method: "DELETE" });
    aoMudar();
  }

  return (
    <div className="cartao surge p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="text-xl">{contagem.emoji}</span>
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-semibold">{contagem.titulo}</h3>
            <p className="text-[12.5px] text-apagado">{dataLonga(contagem.alvo)}</p>
          </div>
        </div>
        <button
          onClick={() => setConfirmando((v) => !v)}
          className="shrink-0 px-1 text-[18px] leading-none text-fantasma active:text-suave"
          aria-label="Opções"
        >
          ⋯
        </button>
      </div>

      <div className="mt-4">
        <Regressiva ate={contagem.alvo} />
      </div>

      {alvo > agora && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-brand-forte"
            style={{ width: `${Math.max(1.5, progresso * 100)}%` }}
          />
        </div>
      )}

      {contagem.descricao && (
        <p className="mt-3 text-[13.5px] leading-relaxed text-suave">{contagem.descricao}</p>
      )}

      {contagem.notificar && contagem.avisos.length > 0 && alvo > agora && (
        <p className="mt-3 text-[12px] text-fantasma">
          🔔 Aviso em {contagem.avisos.map((d) => (d === 0 ? "no dia" : `D-${d}`)).join(", ")}
        </p>
      )}

      {confirmando && (
        <div className="surge mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-3.5">
          <span className="text-[13px] text-apagado">Apagar esta contagem?</span>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmando(false)}
              className="rounded-xl px-3 py-2 text-[13px] text-suave"
            >
              Não
            </button>
            <button
              onClick={excluir}
              disabled={ocupado}
              className="rounded-xl bg-perigo/15 px-3 py-2 text-[13px] font-medium text-perigo disabled:opacity-50"
            >
              Apagar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FormContagem({ aoSalvar }: { aoSalvar: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("09:00");
  const [avisos, setAvisos] = useState<number[]>([30, 14, 7, 3, 1, 0]);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const hoje = new Date().toISOString().slice(0, 10);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    const alvo = new Date(`${data}T${hora || "09:00"}`);
    if (Number.isNaN(alvo.getTime())) {
      setErro("Escolha uma data válida.");
      return;
    }
    if (alvo.getTime() <= Date.now()) {
      setErro("A data precisa estar no futuro.");
      return;
    }

    setOcupado(true);
    try {
      const r = await fetch("/api/contagens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          emoji,
          descricao: descricao.trim() || undefined,
          alvo: alvo.toISOString(),
          avisos,
        }),
      });
      if (!r.ok) {
        setErro((await r.json()).erro ?? "Não consegui salvar.");
        return;
      }
      aoSalvar();
    } catch {
      setErro("Sem conexão com o servidor.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={enviar} className="cartao surge mb-5 space-y-4 p-5">
      <h2 className="text-[16px] font-semibold">Nova contagem</h2>

      <Campo
        rotulo="O que é?"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Viagem para a praia"
        maxLength={80}
        required
      />

      <div>
        <span className="mb-2 block text-[13px] font-medium text-suave">Ícone</span>
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`flex size-10 items-center justify-center rounded-xl border text-lg transition-colors ${
                emoji === e
                  ? "border-brand/50 bg-brand/15"
                  : "border-white/8 bg-white/[0.03]"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2.5">
        <Campo
          rotulo="Data"
          type="date"
          value={data}
          min={hoje}
          onChange={(e) => setData(e.target.value)}
          required
        />
        <Campo
          rotulo="Hora"
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
        />
      </div>

      <Area
        rotulo="Detalhe (opcional)"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Voo 14h, não esquecer o passaporte"
      />

      <div>
        <span className="mb-2 block text-[13px] font-medium text-suave">Me avise em</span>
        <div className="flex flex-wrap gap-2">
          {OPCOES_AVISO.map((d) => {
            const ativo = avisos.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() =>
                  setAvisos((atual) =>
                    ativo ? atual.filter((x) => x !== d) : [...atual, d].sort((a, b) => b - a)
                  )
                }
                className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
                  ativo
                    ? "border-brand/50 bg-brand/15 text-brand-forte"
                    : "border-white/10 bg-white/[0.03] text-apagado"
                }`}
              >
                {d === 0 ? "No dia" : `${d} dias antes`}
              </button>
            );
          })}
        </div>
      </div>

      <Aviso>{erro}</Aviso>

      <Botao type="submit" carregando={ocupado} className="w-full !bg-brand !text-brand-ink !shadow-brand/20">
        Marcar no calendário
      </Botao>
    </form>
  );
}
