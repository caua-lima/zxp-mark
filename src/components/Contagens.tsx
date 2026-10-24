"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  Aviso,
  Botao,
  BotaoEditar,
  Brilho,
  Campo,
  Chave,
  Icone,
  Progresso,
  Secao,
  SeletorHora,
} from "@/components/ui";
import { RegressivaHeroi } from "@/components/Cronometro";
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
  horaAviso: number;
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
          className="flex size-11 items-center justify-center rounded-full bg-brand text-2xl font-light text-brand-ink shadow-lg shadow-brand/25 transition-transform active:scale-95 active:bg-brand-escuro"
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
          <div className="mx-auto mb-4 w-fit">
            <Icone tamanho="lg">🎯</Icone>
          </div>
          <h2 className="text-[17px] font-semibold">Nada marcado ainda</h2>
          <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-apagado">
            Viagem, aniversário, prova, mudança. Marca a data e eu conto os dias por você — com
            um aviso todo dia no horário que você escolher.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {futuras.map((c) => (
          <CartaoContagem key={c.id} contagem={c} agora={agora} aoMudar={() => router.refresh()} />
        ))}
      </div>

      {passadas.length > 0 && (
        <>
          <Secao titulo="Já aconteceram" className="mt-7" />
          <div className="space-y-4 opacity-55">
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
  const [hora, setHora] = useState(contagem.horaAviso);

  const alvo = new Date(contagem.alvo).getTime();
  const criado = new Date(contagem.criadoEm).getTime();
  const total = Math.max(1, alvo - criado);
  const progresso = Math.max(0, Math.min(1, (agora - criado) / total));
  const faltamDias = Math.max(0, Math.ceil((alvo - agora) / DIA));
  // Reta final ganha um brilho: dá pra sentir a proximidade sem ler o número.
  const perto = alvo > agora && faltamDias <= 7;

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
    <div
      className={`cartao surge relative overflow-hidden p-5 ${
        perto ? "border-brand/30 shadow-[0_0_40px_-12px_var(--color-brand)]" : ""
      }`}
    >
      <Brilho />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Icone>{contagem.emoji}</Icone>
            <div className="min-w-0">
              {/* Duas linhas em vez de cortar: "Viagem pro Rio de Janeiro" não
                  cabe numa só no celular, e é o nome da coisa toda. */}
              <h3 className="text-[17px] leading-tight font-semibold">{contagem.titulo}</h3>
              <p className="mt-0.5 text-[12.5px] text-apagado">{dataLonga(contagem.alvo)}</p>
            </div>
          </div>
          <BotaoEditar aoClicar={() => setPainel((v) => !v)} aberto={painel} />
        </div>

        <div className="mt-5">
          <RegressivaHeroi ate={contagem.alvo} />
        </div>

        {alvo > agora && (
          <div className="mt-5">
            <Progresso fracao={progresso} percentual sufixo="do caminho" />
          </div>
        )}

        {contagem.descricao && (
          <p className="mt-3 text-[13.5px] leading-relaxed text-suave">{contagem.descricao}</p>
        )}

        {contagem.notificar && alvo > agora && (
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-fantasma">
            <span>🔔</span>
            {diario
              ? `Todo dia às ${String(hora).padStart(2, "0")}:00`
              : `Aviso em ${contagem.avisos.map((d) => (d === 0 ? "no dia" : `D-${d}`)).join(", ")}`}
          </p>
        )}

        {painel && (
          <div className="surge mt-4 border-t border-borda pt-4">
            <FormEditarContagem
              contagem={contagem}
              aoSalvar={() => {
                setPainel(false);
                aoMudar();
              }}
            />

            <Secao titulo="Avisos" className="mt-6 mb-1" />
            <div className="space-y-1">
            <Chave
              ligado={diario}
              aoMudar={(v) => {
                setDiario(v);
                void alterar({ avisoDiario: v });
              }}
              rotulo="Aviso diário"
              descricao="Todo dia, com quantos dias faltam."
            />
            {diario && (
              <SeletorHora
                rotulo="Horário do aviso"
                valor={hora}
                aoMudar={(h) => {
                  setHora(h);
                  void alterar({ horaAviso: h });
                }}
              />
            )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-borda pt-3.5">
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
    </div>
  );
}

/** Data e hora locais de um instante, nos formatos que <input date/time> pede. */
function partesLocais(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    data: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    hora: `${p(d.getHours())}:${p(d.getMinutes())}`,
  };
}

function FormEditarContagem({
  contagem,
  aoSalvar,
}: {
  contagem: Contagem;
  aoSalvar: () => void;
}) {
  const inicial = useMemo(() => partesLocais(contagem.alvo), [contagem.alvo]);
  const [titulo, setTitulo] = useState(contagem.titulo);
  const [descricao, setDescricao] = useState(contagem.descricao ?? "");
  const [data, setData] = useState(inicial.data);
  const [hora, setHora] = useState(inicial.hora);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  // Mesmo comportamento do cadastro: o ícone acompanha o que se escreve.
  const icone = useMemo(() => iconePara(titulo, descricao), [titulo, descricao]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    const alvo = new Date(`${data}T${hora || "09:00"}`);
    if (Number.isNaN(alvo.getTime())) {
      setErro("Escolha uma data válida.");
      return;
    }

    // Só manda o que mudou. Mandar `alvo` igual ao que já existe faria a API
    // tratar como data nova e liberar de novo todos os avisos já enviados.
    const patch: Record<string, unknown> = {};
    if (titulo.trim() !== contagem.titulo) patch.titulo = titulo.trim();
    if (descricao.trim() !== (contagem.descricao ?? "")) {
      patch.descricao = descricao.trim() || null;
    }
    if (alvo.getTime() !== new Date(contagem.alvo).getTime()) {
      patch.alvo = alvo.toISOString();
    }

    if (Object.keys(patch).length === 0) {
      aoSalvar();
      return;
    }

    setOcupado(true);
    try {
      const r = await fetch(`/api/contagens/${contagem.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) {
        setErro((await r.json().catch(() => null))?.erro ?? "Não consegui salvar.");
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
    <form onSubmit={enviar} className="space-y-3.5">
      <Secao titulo="Editar contagem" className="mb-0" />

      <div className="flex items-end gap-3">
        <div className="flex size-[52px] shrink-0 items-center justify-center rounded-2xl border border-borda bg-white/[0.03] text-2xl">
          {icone}
        </div>
        <div className="min-w-0 flex-1">
          <Campo
            rotulo="O que é?"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
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
          onChange={(e) => setData(e.target.value)}
          required
        />
        <Campo rotulo="Hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
      </div>

      <Area
        rotulo="Detalhe (opcional)"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        rows={2}
        maxLength={500}
      />

      <Aviso>{erro}</Aviso>

      <Botao type="submit" carregando={ocupado} className="w-full">
        Salvar alterações
      </Botao>
    </form>
  );
}

function FormContagem({ aoSalvar }: { aoSalvar: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("09:00");
  const [diario, setDiario] = useState(true);
  const [horaAviso, setHoraAviso] = useState(12);
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
          horaAviso,
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
      <Secao titulo="Nova contagem" className="mb-0" />

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
            placeholder="Viagem pro Rio de Janeiro"
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
        placeholder="Voo 14h, não esquecer o documento"
      />

      <div className="space-y-1 border-t border-borda pt-1">
        <Chave
          ligado={diario}
          aoMudar={setDiario}
          rotulo="Me avise todo dia"
          descricao='"Faltam 26 dias", "faltam 25 dias"... com um empurrão junto.'
        />
        {diario && (
          <SeletorHora rotulo="Em que horário" valor={horaAviso} aoMudar={setHoraAviso} />
        )}
      </div>

      <Aviso>{erro}</Aviso>

      <Botao type="submit" carregando={ocupado} className="w-full">
        Marcar no calendário
      </Botao>
    </form>
  );
}
