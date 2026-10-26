"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Area, Aviso, Botao, Brilho, Campo, Icone, Secao } from "@/components/ui";
import { Trilha } from "@/components/Trilha";
import { Celebracao } from "@/components/Celebracao";
import { formatarDuracao, type DiaDeSono, type ResumoSono } from "@/lib/sono";
import type { PainelProgresso } from "@/lib/painel-progresso";
import { HORA_MS } from "@/lib/datas";

export type RegistroSono = {
  id: string;
  /** relógio de parede no fuso do usuário: "2026-10-25T23:30" */
  dormiuTexto: string;
  acordouTexto: string;
  duracaoMs: number;
  qualidade: number;
  nota: string | null;
};

const QUALIDADES = [
  { v: 1, rotulo: "Muito ruim" },
  { v: 2, rotulo: "Ruim" },
  { v: 3, rotulo: "Regular" },
  { v: 4, rotulo: "Boa" },
  { v: 5, rotulo: "Muito boa" },
];

const horas = (ms: number) => (ms / HORA_MS).toFixed(1).replace(".", ",");

/** "2026-10-25T23:30" → "25/10 23:30" */
function rotuloMomento(t: string) {
  const [d, h] = t.split("T");
  const [, m, dia] = d.split("-");
  return `${dia}/${m} ${h}`;
}

function diaDaSemana(dia: string) {
  return new Date(`${dia}T12:00:00Z`)
    .toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" })
    .replace(".", "");
}

export function Sono({
  registros,
  resumo,
  trilha,
  sugestao,
  fuso,
}: {
  registros: RegistroSono[];
  resumo: ResumoSono;
  trilha: PainelProgresso | null;
  sugestao: { dormiuEm: string; acordouEm: string };
  fuso: string;
}) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  const vazio = registros.length === 0;

  function aoSalvar() {
    setCriando(false);
    setEditando(null);
    router.refresh();
  }

  return (
    <main>
      <header className="mb-5 flex items-center justify-between gap-3">
        <Link href="/marcos" className="text-[14px] text-apagado active:text-suave">
          ← Marcos
        </Link>
        <button
          type="button"
          onClick={() => {
            setEditando(null);
            setCriando((v) => !v);
          }}
          aria-expanded={criando}
          className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-[13.5px] font-semibold text-brand-ink shadow-lg shadow-brand/20 transition-transform active:scale-95 active:bg-brand-escuro"
        >
          {criando ? "Fechar" : "+ Registrar sono"}
        </button>
      </header>

      <h1 className="text-[26px] font-semibold tracking-tight">Sono</h1>
      <p className="mt-1 mb-5 text-[13px] leading-relaxed text-apagado">
        Um registro simples, só para você enxergar o seu padrão. Não há meta de horas.
      </p>

      {criando && (
        <section className="cartao surge mb-5 p-5">
          <Secao titulo="Registrar uma noite" />
          <FormSono
            inicial={{ dormiuEm: sugestao.dormiuEm, acordouEm: sugestao.acordouEm, qualidade: 3, nota: "" }}
            aoSalvar={aoSalvar}
          />
        </section>
      )}

      {vazio && !criando ? (
        <div className="cartao px-6 py-10 text-center">
          <div className="mx-auto mb-4 w-fit">
            <Icone tamanho="lg">🌙</Icone>
          </div>
          <h2 className="text-[17px] font-semibold">Como foi a sua noite?</h2>
          <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-apagado">
            Anote a hora em que dormiu e a hora em que acordou. Com alguns registros, o gráfico
            mostra o seu padrão — e dia sem registro simplesmente fica em branco.
          </p>
          <button
            type="button"
            onClick={() => setCriando(true)}
            className="mt-5 inline-flex rounded-2xl bg-brand px-5 py-3.5 text-[15px] font-semibold text-brand-ink active:bg-brand-escuro"
          >
            Registrar a primeira noite
          </button>
        </div>
      ) : (
        <Grafico resumo={resumo} />
      )}

      {trilha && !vazio && (
        <div className="mt-3.5">
          <Trilha progresso={trilha} />
        </div>
      )}
      {trilha?.celebracao && (
        <Celebracao
          celebracao={trilha.celebracao}
          tipo={trilha.tipo}
          refId={trilha.refId}
          pendentes={trilha.pendentes}
        />
      )}

      {!vazio && (
        <section className="mt-6">
          <Secao titulo="Histórico" />
          <ul className="space-y-2">
            {registros.map((r) => (
              <li key={r.id}>
                {editando === r.id ? (
                  <div className="cartao surge p-5">
                    <Secao titulo="Editar registro" />
                    <FormSono inicial={r} id={r.id} aoSalvar={aoSalvar} aoCancelar={() => setEditando(null)} />
                  </div>
                ) : (
                  <LinhaRegistro
                    registro={r}
                    aoEditar={() => {
                      setCriando(false);
                      setEditando(r.id);
                    }}
                    aoApagar={aoSalvar}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 text-center text-[11.5px] leading-relaxed text-fantasma">
        A duração é a do intervalo que você informou — ela não mede o sono em si.
        <br />
        Horários no fuso {fuso.replace("_", " ")}.
      </p>
    </main>
  );
}

/* -------------------------------- gráfico --------------------------------- */

function Grafico({ resumo }: { resumo: ResumoSono }) {
  const maior = Math.max(10 * HORA_MS, ...resumo.dias.map((d) => d.totalMs ?? 0));
  const ALTURA = 96;

  return (
    <section aria-labelledby="titulo-grafico" className="cartao relative overflow-hidden p-5">
      <Brilho className="-top-20 -right-12 size-52" />
      <div className="relative">
        <h2 id="titulo-grafico" className="text-[11px] font-semibold tracking-[0.18em] text-apagado uppercase">
          Últimos 7 dias
        </h2>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <Numero
            rotulo="Média"
            valor={resumo.mediaMs === null ? "—" : formatarDuracao(resumo.mediaMs)}
            dica="das noites registradas"
          />
          <Numero
            rotulo="Registradas"
            valor={`${resumo.noitesRegistradas} de 7`}
            dica="noites"
          />
          <Numero
            rotulo="Qualidade"
            valor={resumo.qualidadeMedia === null ? "—" : resumo.qualidadeMedia.toFixed(1).replace(".", ",")}
            dica="média de 1 a 5"
          />
        </div>

        {/* O gráfico é só visual; a tabela abaixo é o que o leitor de tela lê. */}
        <div aria-hidden className="mt-5 flex items-end gap-2" style={{ height: ALTURA + 38 }}>
          {resumo.dias.map((d, i) => (
            <Coluna key={d.dia} dia={d} maior={maior} altura={ALTURA} hoje={i === resumo.dias.length - 1} />
          ))}
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-fantasma">
          Cada barra é o que foi registrado no dia. Dia sem registro fica em branco — não conta
          como zero hora.
        </p>

        <table className="sr-only">
          <caption>Sono registrado nos últimos 7 dias</caption>
          <thead>
            <tr>
              <th>Dia</th>
              <th>Duração registrada</th>
              <th>Qualidade média</th>
            </tr>
          </thead>
          <tbody>
            {resumo.dias.map((d) => (
              <tr key={d.dia}>
                <td>{d.dia}</td>
                <td>{d.totalMs === null ? "sem registro" : formatarDuracao(d.totalMs)}</td>
                <td>{d.qualidadeMedia === null ? "sem registro" : d.qualidadeMedia.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Numero({ rotulo, valor, dica }: { rotulo: string; valor: string; dica: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.1em] text-apagado uppercase">{rotulo}</p>
      <p className="numeros font-display mt-1.5 text-[17px] leading-tight font-bold text-tinta">{valor}</p>
      <p className="mt-0.5 text-[10.5px] leading-tight text-fantasma">{dica}</p>
    </div>
  );
}

function Coluna({
  dia,
  maior,
  altura,
  hoje,
}: {
  dia: DiaDeSono;
  maior: number;
  altura: number;
  hoje: boolean;
}) {
  const tem = dia.totalMs !== null;
  const h = tem ? Math.max(6, Math.round(((dia.totalMs as number) / maior) * altura)) : 0;
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-end">
      <span className="numeros mb-1 h-4 text-[10.5px] text-suave">{tem ? horas(dia.totalMs as number) : ""}</span>
      <div className="flex w-full items-end justify-center" style={{ height: altura }}>
        {tem ? (
          <div
            className={`avanco w-full max-w-[28px] rounded-t-lg ${hoje ? "bg-brand" : "bg-brand/55"}`}
            style={{ height: h }}
          />
        ) : (
          <div className="w-full max-w-[28px] border-t-2 border-dashed border-borda" />
        )}
      </div>
      <span className={`mt-1.5 text-[11px] capitalize ${hoje ? "font-semibold text-tinta" : "text-fantasma"}`}>
        {diaDaSemana(dia.dia)}
      </span>
    </div>
  );
}

/* -------------------------------- histórico ------------------------------- */

function LinhaRegistro({
  registro: r,
  aoEditar,
  aoApagar,
}: {
  registro: RegistroSono;
  aoEditar: () => void;
  aoApagar: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const q = QUALIDADES[r.qualidade - 1];

  async function apagar() {
    setOcupado(true);
    setErro("");
    const res = await fetch(`/api/sono/${r.id}`, { method: "DELETE" });
    if (!res.ok) {
      setOcupado(false);
      setErro("Não consegui apagar. Tente de novo.");
      return;
    }
    aoApagar();
  }

  return (
    <div className="cartao p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="numeros font-display text-[19px] leading-tight font-bold text-tinta">
            {formatarDuracao(r.duracaoMs)}
          </p>
          <p className="mt-0.5 text-[12.5px] text-apagado">
            {rotuloMomento(r.dormiuTexto)} → {rotuloMomento(r.acordouTexto)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-suave">
          {r.qualidade}/5 · {q.rotulo}
        </span>
      </div>
      {r.nota && <p className="mt-2 text-[13px] leading-relaxed text-suave">{r.nota}</p>}

      {erro && (
        <p role="alert" className="mt-2 text-[12.5px] text-perigo">
          {erro}
        </p>
      )}

      {confirmando ? (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-borda pt-3">
          <span className="text-[12.5px] text-perigo">Apagar este registro?</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmando(false)} className="rounded-xl px-3 py-2 text-[13px] text-suave">
              Cancelar
            </button>
            <button
              type="button"
              onClick={apagar}
              disabled={ocupado}
              className="rounded-xl bg-perigo/15 px-3 py-2 text-[13px] font-medium text-perigo disabled:opacity-50"
            >
              Apagar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-4 border-t border-borda pt-3 text-[13px]">
          <button type="button" onClick={aoEditar} className="font-medium text-suave active:text-tinta">
            Editar
          </button>
          <button type="button" onClick={() => setConfirmando(true)} className="text-perigo/80 active:text-perigo">
            Apagar
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- formulário ------------------------------- */

type Inicial = { dormiuEm?: string; acordouEm?: string; dormiuTexto?: string; acordouTexto?: string; qualidade: number; nota: string | null };

/** Diferença entre dois relógios de parede, só para a prévia ao vivo. */
function previa(dormiu: string, acordou: string): number | null {
  const a = Date.parse(`${dormiu}:00Z`);
  const b = Date.parse(`${acordou}:00Z`);
  return Number.isNaN(a) || Number.isNaN(b) ? null : b - a;
}

function FormSono({
  inicial,
  id,
  aoSalvar,
  aoCancelar,
}: {
  inicial: Inicial;
  id?: string;
  aoSalvar: () => void;
  aoCancelar?: () => void;
}) {
  const [dormiu, setDormiu] = useState(inicial.dormiuEm ?? inicial.dormiuTexto ?? "");
  const [acordou, setAcordou] = useState(inicial.acordouEm ?? inicial.acordouTexto ?? "");
  const [qualidade, setQualidade] = useState(inicial.qualidade);
  const [nota, setNota] = useState(inicial.nota ?? "");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const ms = previa(dormiu, acordou);
  const invertido = ms !== null && ms <= 0;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (ocupado) return;
    setErro("");
    setOcupado(true);
    try {
      const r = await fetch(id ? `/api/sono/${id}` : "/api/sono", {
        method: id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dormiuEm: dormiu, acordouEm: acordou, qualidade, nota: nota.trim() || null }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(d.erro ?? "Não consegui salvar.");
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
    <form onSubmit={enviar} className="space-y-4">
      <Campo
        rotulo="Dormi em"
        type="datetime-local"
        value={dormiu}
        onChange={(e) => setDormiu(e.target.value)}
        required
      />
      <Campo
        rotulo="Acordei em"
        type="datetime-local"
        value={acordou}
        onChange={(e) => setAcordou(e.target.value)}
        required
      />

      <p
        className={`text-[13px] ${invertido ? "text-perigo" : "text-suave"}`}
        role={invertido ? "alert" : undefined}
        aria-live="polite"
      >
        {ms === null
          ? "Escolha os dois horários."
          : invertido
            ? "Você acordou antes de dormir — confira as datas."
            : `Intervalo informado: ${formatarDuracao(ms)}`}
      </p>

      <div>
        <span className="mb-1.5 block text-[13px] font-medium text-suave">Como foi a qualidade?</span>
        <div role="radiogroup" aria-label="Qualidade do sono" className="grid grid-cols-5 gap-1.5">
          {QUALIDADES.map((q) => (
            <button
              key={q.v}
              type="button"
              role="radio"
              aria-checked={qualidade === q.v}
              aria-label={`${q.v}, ${q.rotulo}`}
              onClick={() => setQualidade(q.v)}
              className={`flex h-12 items-center justify-center rounded-2xl border text-[16px] font-semibold transition-colors ${
                qualidade === q.v
                  ? "border-brand/60 bg-brand/15 text-brand"
                  : "border-borda bg-white/[0.03] text-suave active:bg-white/[0.08]"
              }`}
            >
              {q.v}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-center text-[12px] text-apagado" aria-hidden>
          {QUALIDADES[qualidade - 1].rotulo}
        </p>
      </div>

      <Area
        rotulo="Observação (opcional)"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        rows={2}
        maxLength={500}
      />

      <Aviso>{erro}</Aviso>

      <div className="flex gap-2">
        {aoCancelar && (
          <Botao type="button" variante="fantasma" onClick={aoCancelar} className="flex-1">
            Cancelar
          </Botao>
        )}
        <Botao type="submit" carregando={ocupado} className="flex-1">
          {id ? "Salvar alterações" : "Salvar"}
        </Botao>
      </div>
    </form>
  );
}
