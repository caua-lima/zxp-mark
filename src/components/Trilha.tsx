"use client";

import { useState } from "react";
import { Area, Brilho, Secao } from "@/components/ui";
import { janela } from "@/lib/progressao";
import { dataLonga } from "@/lib/formato";
import type { EtapaPainel, PainelProgresso } from "@/lib/painel-progresso";
import type { Fonte } from "@/lib/beneficios";

/** "2024-05-15" → "15/05/2024", sem passar por Date (que deslocaria o dia pelo fuso). */
function dataCurta(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

const HUMORES = [
  { v: 1, emoji: "😣", rotulo: "Difícil" },
  { v: 2, emoji: "🙁", rotulo: "Meio ruim" },
  { v: 3, emoji: "😐", rotulo: "Normal" },
  { v: 4, emoji: "🙂", rotulo: "Bem" },
  { v: 5, emoji: "😄", rotulo: "Muito bem" },
];

/**
 * A trilha: casas por onde a pessoa anda, e o painel da etapa escolhida.
 * Responde às quatro perguntas — onde estou, o que conquistei, qual o próximo
 * passo e por que vale continuar — sem cobrar nada.
 */
export function Trilha({ progresso: painel }: { progresso: PainelProgresso }) {
  const alvo = painel.etapas.find((e) => e.estado === "atual");
  const ultima = [...painel.etapas].reverse().find((e) => e.estado === "concluida" && !e.inicial);
  const inicial = painel.celebracao?.chave ?? alvo?.chave ?? ultima?.chave ?? painel.etapas[0].chave;

  const [escolhida, setEscolhida] = useState(inicial);
  const [todas, setTodas] = useState(false);

  const visiveis = todas
    ? { itens: painel.etapas, antes: 0, depois: 0 }
    : janela(painel.etapas, 4);
  const etapa = painel.etapas.find((e) => e.chave === escolhida) ?? painel.etapas[0];
  const celebrada = painel.celebracao?.chave;

  return (
    <section aria-label="Trilha de progresso" className="cartao relative overflow-hidden p-5">
      <Brilho className="-top-20 -right-12 size-52" />

      <div className="relative">
        <Resumo painel={painel} />

        <ol
          aria-label="Etapas da trilha"
          className="sem-barra -mx-1 mt-5 flex snap-x items-start gap-0 overflow-x-auto px-1 pb-2"
        >
          {visiveis.antes > 0 && (
            <li className="flex shrink-0 snap-start items-center self-start pt-3">
              <button
                type="button"
                onClick={() => setTodas(true)}
                className="rounded-full px-1.5 py-1.5 text-[11.5px] font-medium text-fantasma active:text-suave"
              >
                +{visiveis.antes}
              </button>
            </li>
          )}
          {visiveis.itens.map((e, i) => (
            <Casa
              key={e.chave}
              etapa={e}
              selecionada={e.chave === etapa.chave}
              recemConquistada={e.chave === celebrada}
              ultima={i === visiveis.itens.length - 1 && visiveis.depois === 0}
              aoEscolher={() => setEscolhida(e.chave)}
            />
          ))}
          {visiveis.depois > 0 && (
            <li className="flex shrink-0 snap-start items-center self-start pt-3">
              <button
                type="button"
                onClick={() => setTodas(true)}
                className="rounded-full px-1.5 py-1.5 text-[11.5px] font-medium text-fantasma active:text-suave"
              >
                +{visiveis.depois}
              </button>
            </li>
          )}
        </ol>

        {todas && (
          <button
            type="button"
            onClick={() => setTodas(false)}
            className="mt-1 text-[12px] text-fantasma underline underline-offset-2 active:text-suave"
          >
            mostrar menos
          </button>
        )}

        {painel.retomada && (
          <p className="surge mt-4 rounded-2xl border border-borda bg-white/[0.03] px-4 py-3 text-[13px] leading-relaxed text-suave">
            {painel.retomada}
          </p>
        )}

        <DetalheDaEtapa painel={painel} etapa={etapa} />
      </div>
    </section>
  );
}

/* --------------------------------- resumo --------------------------------- */

function Resumo({ painel }: { painel: PainelProgresso }) {
  const pct = Math.round(painel.progresso * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-apagado uppercase">Sua trilha</p>
        <p className="numeros text-[12px] text-suave">
          {painel.concluidas} de {painel.total} etapas
        </p>
      </div>

      {painel.proximaTitulo ? (
        <>
          <p className="mt-2 text-[15px] leading-snug text-tinta">
            Próxima etapa: <span className="font-semibold text-brand">{painel.proximaTitulo}</span>
          </p>
          <p className="mt-0.5 text-[12.5px] text-apagado">faltam {painel.faltaTexto}</p>
          <div
            role="progressbar"
            aria-label="Caminho até a próxima etapa"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"
          >
            <div
              className="avanco h-full rounded-full bg-gradient-to-r from-brand-escuro to-brand"
              style={{ width: `${Math.max(2, pct)}%` }}
            />
          </div>
        </>
      ) : (
        <p className="mt-2 text-[15px] leading-snug text-tinta">
          Você percorreu a trilha inteira. O registro continua valendo.
        </p>
      )}
    </div>
  );
}

/* ---------------------------------- casa ---------------------------------- */

function Casa({
  etapa,
  selecionada,
  recemConquistada,
  ultima,
  aoEscolher,
}: {
  etapa: EtapaPainel;
  selecionada: boolean;
  recemConquistada: boolean;
  ultima: boolean;
  aoEscolher: () => void;
}) {
  const feita = etapa.estado === "concluida";
  const atual = etapa.estado === "atual";

  const estado = feita ? "concluída" : atual ? "próxima etapa" : "ainda não chegou";

  return (
    <li className="flex shrink-0 snap-start items-start">
      <div className="flex w-[52px] flex-col items-center">
        <button
          type="button"
          onClick={aoEscolher}
          aria-pressed={selecionada}
          aria-current={atual ? "step" : undefined}
          aria-label={`${etapa.titulo}, ${estado}`}
          className={`flex size-11 items-center justify-center rounded-full border-2 transition-colors ${
            feita
              ? "border-brand bg-brand text-brand-ink"
              : atual
                ? "alvo-respira border-brand bg-brand/10 text-brand"
                : "border-borda bg-transparent text-fantasma"
          } ${recemConquistada ? "desbloqueia" : ""} ${
            selecionada ? "ring-4 ring-brand/25" : ""
          } ${etapa.relevante && !feita && !atual ? "border-borda-forte" : ""}`}
        >
          {feita ? <Marca /> : etapa.relevante ? <Estrela /> : <Ponto />}
        </button>
        <span
          className={`numeros mt-1.5 max-w-[52px] truncate text-center text-[10.5px] ${
            selecionada ? "text-tinta" : feita ? "text-suave" : "text-fantasma"
          }`}
        >
          {etapa.curto}
        </span>
      </div>
      {!ultima && (
        <span
          aria-hidden
          className={`mt-[20px] h-0.5 w-2 shrink-0 rounded-full ${feita ? "bg-brand" : "bg-borda"}`}
        />
      )}
    </li>
  );
}

const Marca = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
const Estrela = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
  </svg>
);
const Ponto = () => <span aria-hidden className="size-2 rounded-full bg-current" />;

/* --------------------------- detalhe da etapa ----------------------------- */

function DetalheDaEtapa({ painel, etapa }: { painel: PainelProgresso; etapa: EtapaPainel }) {
  const c = painel.conteudos[etapa.chave];
  const feita = etapa.estado === "concluida";

  return (
    <div
      role="region"
      aria-label={`Detalhes: ${etapa.titulo}`}
      className="surge mt-4 space-y-4 border-t border-borda pt-4"
      key={etapa.chave}
    >
      <div>
        <h3 className="text-[16px] leading-snug font-semibold text-tinta">{etapa.titulo}</h3>
        {!feita && (
          <p className="mt-0.5 text-[12.5px] text-apagado">
            {etapa.estado === "atual" && painel.faltaTexto
              ? `Faltam ${painel.faltaTexto}.`
              : "Ainda não chegou."}
          </p>
        )}
      </div>

      {feita && (
        <Bloco rotulo="Conquista registrada" tom="brand">
          <p>{c.conquista}</p>
          {etapa.quando && (
            <p className="mt-1 text-[12px] text-apagado">{dataLonga(etapa.quando)}</p>
          )}
        </Bloco>
      )}

      <Bloco rotulo="Benefício possível" tom="suave">
        <p>{c.beneficio.texto}</p>
        {c.beneficio.tipo === "fonte" && (
          <div className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-apagado">
            <p>{c.beneficio.aviso}</p>
            <Referencia fonte={c.beneficio.fonte} />
          </div>
        )}
      </Bloco>

      {feita && (
        <Bloco rotulo="Melhora percebida" tom="suave">
          <Percepcao
            key={etapa.chave}
            tipo={painel.tipo}
            refId={painel.refId}
            chave={etapa.chave}
            inicial={painel.percepcoes[etapa.chave]}
          />
        </Bloco>
      )}

      <Bloco rotulo="Próximo passo" tom="suave">
        <p>{c.proximoPasso}</p>
      </Bloco>
    </div>
  );
}

function Bloco({
  rotulo,
  tom,
  children,
}: {
  rotulo: string;
  tom: "brand" | "suave";
  children: React.ReactNode;
}) {
  return (
    <div>
      <Secao titulo={rotulo} className="mb-1.5" />
      <div
        className={`text-[14px] leading-relaxed ${
          tom === "brand" ? "text-tinta" : "text-suave"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Referencia({ fonte }: { fonte: Fonte }) {
  return (
    <p>
      Fonte:{" "}
      <a
        href={fonte.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-suave underline underline-offset-2"
      >
        {fonte.orgao} — {fonte.titulo}
      </a>
      {fonte.dataDaPagina ? ` · página de ${dataCurta(fonte.dataDaPagina)}` : ""}
      {` · conferido em ${dataCurta(fonte.verificadoEm)}`}
      {fonte.verificacao === "resumo de busca" ? " (a partir de resumo, não da página)" : ""}
    </p>
  );
}

/* ------------------------- "como você está se sentindo?" ------------------ */

type Salva = { humor: number | null; nota: string | null } | undefined;

/**
 * Opcional por definição: começa fechado, nunca aparece como pendência, e
 * salvar em branco apaga. A pergunta existe, a obrigação não.
 */
function Percepcao({
  tipo,
  refId,
  chave,
  inicial,
}: {
  tipo: string;
  refId: string;
  chave: string;
  inicial: Salva;
}) {
  const [salva, setSalva] = useState<Salva>(inicial);
  const [aberto, setAberto] = useState(false);
  const [humor, setHumor] = useState<number | null>(inicial?.humor ?? null);
  const [nota, setNota] = useState(inicial?.nota ?? "");
  const [estado, setEstado] = useState<"" | "salvando" | "salvo" | "erro">("");
  const [erro, setErro] = useState("");

  async function salvar() {
    setEstado("salvando");
    setErro("");
    try {
      const r = await fetch("/api/percepcoes", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tipo, refId, chave, humor, nota: nota.trim() || null }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(d.erro ?? "Não consegui salvar.");
        setEstado("erro");
        return;
      }
      setSalva(d.percepcao ?? undefined);
      setEstado("salvo");
      setAberto(false);
    } catch {
      setErro("Sem conexão com o servidor.");
      setEstado("erro");
    }
  }

  if (!aberto) {
    return (
      <div>
        {salva ? (
          <p className="text-[14px] text-tinta">
            {salva.humor ? `${HUMORES[salva.humor - 1].emoji} ${HUMORES[salva.humor - 1].rotulo}` : ""}
            {salva.humor && salva.nota ? " — " : ""}
            {salva.nota}
          </p>
        ) : (
          <p className="text-[13px] text-apagado">
            Só você sabe como está se sentindo. Se quiser, anote — é opcional.
          </p>
        )}
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="mt-2 rounded-full border border-borda bg-white/[0.04] px-3.5 py-2 text-[13px] font-medium text-suave active:bg-white/[0.08]"
        >
          {salva ? "Editar anotação" : "Como você está se sentindo?"}
        </button>
        {estado === "salvo" && (
          <p role="status" className="surge mt-2 text-[12px] text-sucesso">
            Anotado ✓
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Como você está se sentindo" className="flex gap-1.5">
        {HUMORES.map((h) => (
          <button
            key={h.v}
            type="button"
            role="radio"
            aria-checked={humor === h.v}
            aria-label={h.rotulo}
            onClick={() => setHumor(humor === h.v ? null : h.v)}
            className={`flex h-12 flex-1 flex-col items-center justify-center rounded-2xl border text-[20px] transition-colors ${
              humor === h.v
                ? "border-brand/60 bg-brand/15"
                : "border-borda bg-white/[0.03] active:bg-white/[0.08]"
            }`}
          >
            <span aria-hidden>{h.emoji}</span>
          </button>
        ))}
      </div>
      <p className="text-center text-[12px] text-apagado" aria-hidden>
        {humor ? HUMORES[humor - 1].rotulo : "Toque para escolher — ou pule"}
      </p>
      <Area
        rotulo="Uma nota curta (opcional)"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        rows={2}
        maxLength={300}
      />
      {erro && (
        <p role="alert" className="text-[13px] text-perigo">
          {erro}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="flex-1 rounded-2xl px-4 py-3 text-[14px] text-suave active:bg-white/5"
        >
          Fechar
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={estado === "salvando"}
          className="flex-1 rounded-2xl bg-brand px-4 py-3 text-[14px] font-semibold text-brand-ink transition-colors active:bg-brand-escuro disabled:opacity-50"
        >
          {estado === "salvando" ? "Salvando…" : humor === null && !nota.trim() ? "Limpar" : "Salvar"}
        </button>
      </div>
    </div>
  );
}
