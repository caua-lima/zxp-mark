"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Area, Aviso, Botao, Campo } from "@/components/ui";
import { Cronometro } from "@/components/Cronometro";
import { preset, situacao } from "@/lib/habitos";
import { dataLonga, duracaoExtenso, impacto, reais, rotuloMs } from "@/lib/formato";

export type MarcoDetalhe = {
  id: string;
  titulo: string;
  preset: string;
  emoji: string;
  porque: string | null;
  inicio: string;
  cicloInicio: string;
  melhorMs: number;
  unidadesPorDia: number | null;
  gastoDiario: number | null;
  recaidas: { id: string; quando: string; duracaoMs: number; gatilho: string | null; nota: string | null }[];
};

export function DetalheMarco({ marco, agora }: { marco: MarcoDetalhe; agora: number }) {
  const router = useRouter();
  const [painel, setPainel] = useState<"nenhum" | "recaida" | "ajustar" | "excluir">("nenhum");

  const decorrido = Math.max(0, agora - new Date(marco.cicloInicio).getTime());
  const p = preset(marco.preset);
  const { proximo, anterior, atingidos, progresso } = situacao(marco.preset, decorrido);
  const st = impacto(marco, agora);
  const recorde = Math.max(marco.melhorMs, decorrido);

  return (
    <main>
      <header className="mb-5 flex items-center justify-between">
        <Link href="/marcos" className="text-[14px] text-apagado active:text-suave">
          ← Marcos
        </Link>
        <button
          onClick={() => setPainel(painel === "ajustar" ? "nenhum" : "ajustar")}
          className="text-[14px] text-apagado active:text-suave"
        >
          Ajustes
        </button>
      </header>

      {/* --------------------------- cronômetro --------------------------- */}
      <section className="cartao relative overflow-hidden p-6 text-center">
        <Anel progresso={progresso} />
        <div className="relative">
          <span className="text-3xl">{marco.emoji}</span>
          <h1 className="mt-2 text-[18px] font-semibold">{marco.titulo}</h1>
          <div className="mt-5 flex justify-center">
            <Cronometro desde={marco.cicloInicio} tamanho="grande" />
          </div>
          <p className="mt-1.5 text-[13.5px] text-apagado">{p.sufixo}</p>
          <p className="mt-3 text-[12.5px] text-fantasma">
            desde {dataLonga(marco.cicloInicio)}
          </p>
        </div>
      </section>

      {/* ------------------------- próximo marco -------------------------- */}
      {proximo ? (
        <section className="cartao mt-3.5 p-5">
          <p className="text-[12px] font-medium tracking-wide text-apagado uppercase">
            Próximo marco
          </p>
          <h2 className="mt-1.5 text-[17px] font-semibold text-brand">{proximo.titulo}</h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-suave">{proximo.corpo}</p>
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-[12px] text-apagado">
              <span>faltam {duracaoExtenso(proximo.ms - decorrido)}</span>
              <span className="numeros">{Math.round(progresso * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-brand-escuro transition-[width] duration-1000"
                style={{ width: `${Math.max(2, progresso * 100)}%` }}
              />
            </div>
          </div>
        </section>
      ) : (
        <section className="cartao mt-3.5 p-5 text-center">
          <p className="text-[15px] font-semibold text-brand">
            Você bateu todos os marcos deste hábito. 🏆
          </p>
        </section>
      )}

      {/* --------------------------- estatísticas ------------------------- */}
      <section className="mt-3.5 grid grid-cols-2 gap-3">
        <Estatistica
          rotulo="Marcos batidos"
          valor={`${atingidos.length}`}
          sub={`de ${p.marcos.length}`}
        />
        <Estatistica rotulo="Melhor sequência" valor={duracaoExtenso(recorde)} />
        {st.dinheiroEconomizado !== null && (
          <Estatistica
            rotulo="Economizado"
            valor={reais(st.dinheiroEconomizado)}
            destaque
          />
        )}
        {st.unidadesEvitadas !== null && (
          <Estatistica
            rotulo={`${st.unidadeNome[0].toUpperCase()}${st.unidadeNome.slice(1)} evitados`}
            valor={String(st.unidadesEvitadas)}
          />
        )}
        {st.minutosDeVida !== null && st.minutosDeVida > 60 && (
          <Estatistica
            rotulo="Vida recuperada"
            valor={`${Math.round(st.minutosDeVida / 60)}h`}
            sub="estimativa"
          />
        )}
        <Estatistica
          rotulo="Recaídas"
          valor={String(marco.recaidas.length)}
          sub={marco.recaidas.length ? `última em ${dataLonga(marco.recaidas[0].quando)}` : "nenhuma"}
        />
      </section>

      {marco.porque && (
        <section className="cartao mt-3.5 border-brand/20 bg-brand/[0.05] p-5">
          <p className="text-[12px] font-medium tracking-wide text-brand/70 uppercase">
            Seu porquê
          </p>
          <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-brand">
            {marco.porque}
          </p>
        </section>
      )}

      {/* ----------------------------- ações ------------------------------ */}
      <div className="mt-3.5 grid grid-cols-2 gap-3">
        <Link
          href="/ajuda?sos=1"
          className="flex items-center justify-center rounded-2xl border border-perigo/25 bg-perigo/10 py-3.5 text-[14px] font-semibold text-perigo active:bg-perigo/20"
        >
          Estou com vontade
        </Link>
        <button
          onClick={() => setPainel(painel === "recaida" ? "nenhum" : "recaida")}
          className="rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 text-[14px] font-medium text-suave active:bg-white/[0.08]"
        >
          Registrar recaída
        </button>
      </div>

      {painel === "recaida" && (
        <PainelRecaida
          marcoId={marco.id}
          decorrido={decorrido}
          aoFechar={() => setPainel("nenhum")}
          aoSalvar={() => {
            setPainel("nenhum");
            router.refresh();
          }}
        />
      )}

      {painel === "ajustar" && (
        <PainelAjustes
          marco={marco}
          aoFechar={() => setPainel("nenhum")}
          aoSalvar={() => {
            setPainel("nenhum");
            router.refresh();
          }}
          aoExcluir={() => {
            router.replace("/marcos");
            router.refresh();
          }}
        />
      )}

      {/* --------------------------- linha do tempo ----------------------- */}
      <section className="mt-6">
        <h2 className="mb-3 text-[13px] font-medium text-suave">Linha do tempo</h2>
        <ol className="relative space-y-0 border-l border-white/10 pl-5">
          {p.marcos.map((m) => {
            const batido = m.ms <= decorrido;
            const atual = anterior?.chave === m.chave;
            const quando = new Date(new Date(marco.cicloInicio).getTime() + m.ms);
            return (
              <li key={m.chave} className="relative pb-5">
                <span
                  className={`absolute -left-[26px] top-1 size-3 rounded-full border-2 ${
                    batido
                      ? "border-brand bg-brand"
                      : "border-white/15 bg-[#191917]"
                  } ${atual ? "ring-4 ring-brand/20" : ""}`}
                />
                <div className="flex items-baseline justify-between gap-3">
                  <h3
                    className={`text-[14.5px] font-medium ${
                      batido ? "text-tinta" : "text-apagado"
                    }`}
                  >
                    {m.titulo}
                  </h3>
                  <span className="numeros shrink-0 text-[11.5px] text-fantasma">
                    {rotuloMs(m.ms)}
                  </span>
                </div>
                <p
                  className={`mt-1 text-[13px] leading-relaxed ${
                    batido ? "text-suave" : "text-fantasma"
                  }`}
                >
                  {m.corpo}
                </p>
                {batido && (
                  <p className="mt-1.5 text-[11.5px] text-brand/70">
                    conquistado em {dataLonga(quando)}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {marco.recaidas.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-[13px] font-medium text-suave">
            Histórico de recaídas
            <span className="ml-2 font-normal text-fantasma">— dado, não fracasso</span>
          </h2>
          <div className="space-y-2">
            {marco.recaidas.map((r) => (
              <div key={r.id} className="cartao p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[14px] text-tinta">{dataLonga(r.quando)}</span>
                  <span className="text-[12px] text-apagado">
                    durou {duracaoExtenso(r.duracaoMs)}
                  </span>
                </div>
                {r.gatilho && (
                  <p className="mt-1.5 text-[13px] text-brand/80">Gatilho: {r.gatilho}</p>
                )}
                {r.nota && <p className="mt-1 text-[13px] text-suave">{r.nota}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

/* ------------------------------ subcomponentes -------------------------- */

function Anel({ progresso }: { progresso: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 m-auto size-[240px] opacity-30"
      aria-hidden
    >
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-borda-forte)" strokeWidth="1.5" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={`${c * progresso} ${c}`}
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
}

function Estatistica({
  rotulo,
  valor,
  sub,
  destaque,
}: {
  rotulo: string;
  valor: string;
  sub?: string;
  destaque?: boolean;
}) {
  return (
    <div className="cartao p-4">
      <p className="text-[11.5px] tracking-wide text-apagado uppercase">{rotulo}</p>
      <p
        className={`numeros mt-1.5 text-[19px] leading-tight font-semibold ${
          destaque ? "text-brand" : "text-tinta"
        }`}
      >
        {valor}
      </p>
      {sub && <p className="mt-0.5 text-[11.5px] text-fantasma">{sub}</p>}
    </div>
  );
}

const GATILHOS = ["Estresse", "Álcool", "Festa", "Tédio", "Café", "Briga", "Sozinho", "Trabalho"];

function PainelRecaida({
  marcoId,
  decorrido,
  aoFechar,
  aoSalvar,
}: {
  marcoId: string;
  decorrido: number;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [gatilho, setGatilho] = useState("");
  const [nota, setNota] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function salvar() {
    setOcupado(true);
    setErro("");
    try {
      const r = await fetch(`/api/marcos/${marcoId}/recaida`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gatilho: gatilho || undefined, nota: nota.trim() || undefined }),
      });
      if (!r.ok) {
        setErro((await r.json()).erro ?? "Não consegui registrar.");
        return;
      }
      aoSalvar();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="cartao surge mt-3.5 p-5">
      <h2 className="text-[16px] font-semibold">Recaída acontece.</h2>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-suave">
        Você segurou por {duracaoExtenso(decorrido)} — isso não some, fica no seu histórico.
        Anotar o gatilho é o que faz a próxima tentativa ser diferente.
      </p>

      <p className="mt-4 mb-2 text-[12.5px] text-apagado">O que disparou?</p>
      <div className="flex flex-wrap gap-2">
        {GATILHOS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGatilho(gatilho === g ? "" : g)}
            className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
              gatilho === g
                ? "border-brand/50 bg-brand/15 text-brand"
                : "border-white/10 bg-white/[0.03] text-suave"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="mt-3.5">
        <Area
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="O que estava acontecendo? (opcional)"
        />
      </div>

      <Aviso>{erro}</Aviso>

      <div className="mt-4 flex gap-2">
        <Botao variante="fantasma" onClick={aoFechar} className="flex-1">
          Cancelar
        </Botao>
        <Botao variante="perigo" onClick={salvar} carregando={ocupado} className="flex-1">
          Registrar e reiniciar
        </Botao>
      </div>
    </section>
  );
}

function PainelAjustes({
  marco,
  aoFechar,
  aoSalvar,
  aoExcluir,
}: {
  marco: MarcoDetalhe;
  aoFechar: () => void;
  aoSalvar: () => void;
  aoExcluir: () => void;
}) {
  const local = (iso: string) => {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [titulo, setTitulo] = useState(marco.titulo);
  const [porque, setPorque] = useState(marco.porque ?? "");
  const [inicio, setInicio] = useState(local(marco.cicloInicio));
  const [unidades, setUnidades] = useState(marco.unidadesPorDia?.toString() ?? "");
  const [gasto, setGasto] = useState(marco.gastoDiario?.toString() ?? "");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  async function salvar() {
    setOcupado(true);
    setErro("");
    try {
      const d = new Date(inicio);
      if (Number.isNaN(d.getTime())) {
        setErro("Data inválida.");
        return;
      }
      const r = await fetch(`/api/marcos/${marco.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          porque: porque.trim() || null,
          cicloInicio: d.toISOString(),
          unidadesPorDia: unidades ? Number(unidades.replace(",", ".")) : null,
          gastoDiario: gasto ? Number(gasto.replace(",", ".")) : null,
        }),
      });
      if (!r.ok) {
        setErro((await r.json()).erro ?? "Não consegui salvar.");
        return;
      }
      aoSalvar();
    } finally {
      setOcupado(false);
    }
  }

  async function excluir() {
    setOcupado(true);
    await fetch(`/api/marcos/${marco.id}`, { method: "DELETE" });
    aoExcluir();
  }

  return (
    <section className="cartao surge mt-3.5 space-y-3.5 p-5">
      <h2 className="text-[16px] font-semibold">Ajustes</h2>

      <Campo
        rotulo="Nome"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        maxLength={80}
      />
      <Campo
        rotulo="Início da sequência atual"
        type="datetime-local"
        value={inicio}
        onChange={(e) => setInicio(e.target.value)}
        dica="Corrigir a data recalcula todos os marcos e libera os avisos de novo."
      />
      <Area
        rotulo="Seu porquê"
        value={porque}
        onChange={(e) => setPorque(e.target.value)}
        rows={3}
        maxLength={2000}
      />
      <div className="grid grid-cols-2 gap-2.5">
        <Campo
          rotulo="Por dia"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={unidades}
          onChange={(e) => setUnidades(e.target.value)}
        />
        <Campo
          rotulo="R$ por dia"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={gasto}
          onChange={(e) => setGasto(e.target.value)}
        />
      </div>

      <Aviso>{erro}</Aviso>

      <div className="flex gap-2 pt-1">
        <Botao variante="fantasma" onClick={aoFechar} className="flex-1">
          Fechar
        </Botao>
        <Botao onClick={salvar} carregando={ocupado} className="flex-1">
          Salvar
        </Botao>
      </div>

      <div className="border-t border-white/8 pt-3.5">
        {confirmando ? (
          <div className="space-y-2.5">
            <p className="text-[13.5px] text-perigo">
              Isso apaga o marco, o histórico e as recaídas. Não dá para desfazer.
            </p>
            <div className="flex gap-2">
              <Botao variante="fantasma" onClick={() => setConfirmando(false)} className="flex-1">
                Cancelar
              </Botao>
              <Botao variante="perigo" onClick={excluir} carregando={ocupado} className="flex-1">
                Apagar mesmo assim
              </Botao>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            className="text-[13.5px] text-perigo/80 active:text-perigo"
          >
            Excluir este marco
          </button>
        )}
      </div>
    </section>
  );
}
