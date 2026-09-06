"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Area, Aviso, Botao, Campo, Chave } from "@/components/ui";
import { Regressiva } from "@/components/Cronometro";
import { dataLonga } from "@/lib/formato";
import { iconePara } from "@/lib/deteccao";
import { DIA } from "@/lib/habitos";

export type Contagem = {
  id: string;
  titulo: string;
  emoji: string;
  descricao: string | null;
  alvo: string;
  criadoEm: string;
  avisoDiario: boolean;
  avisos: number[];
  notificar: boolean;
};

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
            um aviso todo dia no celular.
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
  const [painel, setPainel] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [diario, setDiario] = useState(contagem.avisoDiario);

  const alvo = new Date(contagem.alvo).getTime();
  const criado = new Date(contagem.criadoEm).getTime();
  const total = Math.max(1, alvo - criado);
  const progresso = Math.max(0, Math.min(1, (agora - criado) / total));
  const faltamDias = Math.max(0, Math.ceil((alvo - agora) / DIA));

  async function alterar(patch: Record<string, unknown>) {
    setOcupado(true);
    await fetch(`/api/contagens/${contagem.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    setOcupado(false);
  }

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
          onClick={() => setPainel((v) => !v)}
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

      {contagem.notificar && alvo > agora && (
        <p className="mt-3 text-[12px] text-fantasma">
          {diario
            ? `🔔 Aviso todo dia: "faltam ${faltamDias} dias"`
            : `🔔 Aviso em ${contagem.avisos.map((d) => (d === 0 ? "no dia" : `D-${d}`)).join(", ")}`}
        </p>
      )}

      {painel && (
        <div className="surge mt-4 space-y-1 border-t border-borda pt-2">
          <Chave
            ligado={diario}
            aoMudar={(v) => {
              setDiario(v);
              void alterar({ avisoDiario: v });
            }}
            rotulo="Aviso diário"
            descricao="Todo dia, com quantos dias faltam."
          />
          <div className="flex items-center justify-between gap-3 border-t border-borda pt-3.5">
            <span className="text-[13px] text-apagado">Apagar esta contagem?</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPainel(false)}
                className="rounded-xl px-3 py-2 text-[13px] text-suave"
              >
                Fechar
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
        </div>
      )}
    </div>
  );
}

function FormContagem({ aoSalvar }: { aoSalvar: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("09:00");
  const [diario, setDiario] = useState(true);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const hoje = new Date().toISOString().slice(0, 10);
  // O ícone aparece ao vivo enquanto se escreve — o sistema escolhe, mas a
  // pessoa vê a escolha acontecendo em vez de receber um emoji do nada.
  const icone = useMemo(() => iconePara(titulo, descricao), [titulo, descricao]);

  const faltam = useMemo(() => {
    if (!data) return null;
    const alvo = new Date(`${data}T${hora || "09:00"}`).getTime();
    if (Number.isNaN(alvo)) return null;
    return Math.max(0, Math.ceil((alvo - Date.now()) / DIA));
  }, [data, hora]);

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
          descricao: descricao.trim() || undefined,
          alvo: alvo.toISOString(),
          avisoDiario: diario,
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

      <div className="flex items-end gap-3">
        <div
          className="flex size-[52px] shrink-0 items-center justify-center rounded-2xl border border-borda bg-white/[0.03] text-2xl"
          title="Escolhido pelo título"
        >
          {icone}
        </div>
        <div className="min-w-0 flex-1">
          <Campo
            rotulo="O que é?"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Viagem para a praia"
            maxLength={80}
            required
          />
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

      {faltam !== null && faltam > 0 && (
        <p className="surge text-[13px] text-brand">
          Faltam <span className="numeros font-semibold">{faltam}</span>{" "}
          {faltam === 1 ? "dia" : "dias"}.
        </p>
      )}

      <Area
        rotulo="Detalhe (opcional)"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Voo 14h, não esquecer o passaporte"
      />

      <div className="border-t border-borda pt-1">
        <Chave
          ligado={diario}
          aoMudar={setDiario}
          rotulo="Me avise todo dia"
          descricao='Uma notificação por dia: "faltam 66 dias", "faltam 65 dias"...'
        />
      </div>

      <Aviso>{erro}</Aviso>

      <Botao type="submit" carregando={ocupado} className="w-full">
        Marcar no calendário
      </Botao>
    </form>
  );
}
