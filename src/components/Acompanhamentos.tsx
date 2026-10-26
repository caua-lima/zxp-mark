"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Area, Aviso, Botao, Brilho, Campo, Icone, Secao } from "@/components/ui";
import {
  CATEGORIAS,
  TONS,
  categoria,
  descreverTempo,
  type Tom,
} from "@/lib/acompanhamento";
import { etapasDoAcompanhamento, posicionar } from "@/lib/progressao";
import { duracaoExtenso, dataLonga } from "@/lib/formato";

/** Dados já serializados; `inicioTexto` é o relógio de parede no fuso do usuário. */
export type AcompanhamentoDados = {
  id: string;
  titulo: string;
  categoria: string;
  emoji: string;
  tom: string;
  descricao: string | null;
  inicio: string;
  inicioTexto: string;
  arquivadoEm: string | null;
};

/** Cores de destaque: só tokens que o app já tem. */
export const CLASSES_TOM: Record<string, { texto: string; fundo: string; borda: string }> = {
  magenta: { texto: "text-brand", fundo: "bg-brand/12", borda: "border-brand/30" },
  marfim: { texto: "text-tinta", fundo: "bg-white/[0.08]", borda: "border-white/25" },
  sucesso: { texto: "text-sucesso", fundo: "bg-sucesso/12", borda: "border-sucesso/30" },
};
export const tomDe = (t: string) => CLASSES_TOM[t] ?? CLASSES_TOM.magenta;

/** "Agora" que anda sozinho a cada minuto: o dia e as horas não ficam velhos na tela. */
export function useAgora(inicial: number, passoMs = 60_000) {
  const [agora, setAgora] = useState(inicial);
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), passoMs);
    return () => clearInterval(t);
  }, [passoMs]);
  return agora;
}

/* ------------------------------- lista ------------------------------------ */

export function Acompanhamentos({
  ativos,
  arquivados,
  agora: agoraServidor,
  fuso,
}: {
  ativos: AcompanhamentoDados[];
  arquivados: AcompanhamentoDados[];
  agora: number;
  fuso: string;
}) {
  const router = useRouter();
  const agora = useAgora(agoraServidor);
  const [criando, setCriando] = useState(ativos.length === 0 && arquivados.length === 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-apagado">Há quanto tempo desde um começo</p>
        <button
          type="button"
          onClick={() => setCriando((v) => !v)}
          className="flex size-11 items-center justify-center rounded-full bg-brand text-2xl font-light text-brand-ink shadow-lg shadow-brand/25 transition-transform active:scale-95 active:bg-brand-escuro"
          aria-label={criando ? "Fechar" : "Novo acompanhamento"}
          aria-expanded={criando}
        >
          {criando ? "×" : "+"}
        </button>
      </div>

      {criando && (
        <div className="cartao surge mb-5 p-5">
          <Secao titulo="Novo acompanhamento" />
          <FormAcompanhamento
            aoSalvar={() => {
              setCriando(false);
              router.refresh();
            }}
          />
        </div>
      )}

      {ativos.length === 0 && !criando && (
        <div className="cartao px-6 py-10 text-center">
          <div className="mx-auto mb-4 w-fit">
            <Icone tamanho="lg">⏱️</Icone>
          </div>
          <h2 className="text-[17px] font-semibold">Quanto tempo desde o começo?</h2>
          <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-apagado">
            O início de um tratamento, de uma rotina, de um projeto. Marque a data e o tempo passa a
            ser contado a partir dela — sem cobrar nada de você.
          </p>
          <button
            type="button"
            onClick={() => setCriando(true)}
            className="mt-5 inline-flex rounded-2xl bg-brand px-5 py-3.5 text-[15px] font-semibold text-brand-ink active:bg-brand-escuro"
          >
            Começar uma contagem
          </button>
        </div>
      )}

      <div className="space-y-4">
        {ativos.map((a) => (
          <CartaoAcompanhamento key={a.id} dados={a} agora={agora} fuso={fuso} />
        ))}
      </div>

      {arquivados.length > 0 && (
        <details className="mt-7">
          <summary className="cursor-pointer text-[12px] font-semibold tracking-[0.12em] text-apagado uppercase">
            Arquivados ({arquivados.length})
          </summary>
          <div className="mt-3 space-y-2">
            {arquivados.map((a) => (
              <LinhaArquivada key={a.id} dados={a} aoMudar={() => router.refresh()} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function CartaoAcompanhamento({
  dados,
  agora,
  fuso,
}: {
  dados: AcompanhamentoDados;
  agora: number;
  fuso: string;
}) {
  const tom = tomDe(dados.tom);
  const cat = categoria(dados.categoria);
  const t = descreverTempo(dados.categoria, new Date(dados.inicio), agora, fuso);
  const pos = posicionar(etapasDoAcompanhamento(), agora - new Date(dados.inicio).getTime());
  const pct = Math.round(pos.progresso * 100);

  return (
    <Link
      href={`/contagem/desde/${dados.id}`}
      className="cartao surge relative block overflow-hidden p-5 transition-colors active:bg-white/[0.04]"
    >
      <Brilho />
      <div className="relative">
        <div className="flex items-start gap-3">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl ${tom.fundo}`}
            aria-hidden
          >
            {dados.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] leading-tight font-semibold">{dados.titulo}</h3>
            <p className="mt-0.5 text-[12.5px] text-apagado">
              {cat.rotulo} · desde {dataLonga(dados.inicio)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-end gap-3">
          <div>
            <p
              className={`numeros font-display text-[56px] leading-[0.85] font-extrabold ${tom.texto}`}
            >
              {t.heroi.valor}
            </p>
            <p className="mt-1.5 text-[11px] font-semibold tracking-[0.18em] text-apagado uppercase">
              {t.heroi.unidade === "min" ? "minutos" : t.heroi.unidade}
            </p>
          </div>
          <p className="mb-1 text-[13px] text-suave">
            Dia <span className="numeros font-semibold text-tinta">{t.diaN}</span>
          </p>
        </div>
        <p className="mt-2 text-[13px] text-apagado">{t.frase}</p>

        {pos.atual && (
          <div className="mt-4">
            <div className="flex items-baseline justify-between gap-3 text-[12px]">
              <span className="truncate text-apagado">
                Próxima etapa: <span className="text-suave">{pos.atual.titulo}</span>
              </span>
              <span className="numeros shrink-0 text-fantasma">{duracaoExtenso(pos.falta)}</span>
            </div>
            <div
              role="progressbar"
              aria-label="Caminho até a próxima etapa"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-escuro to-brand"
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function LinhaArquivada({ dados, aoMudar }: { dados: AcompanhamentoDados; aoMudar: () => void }) {
  const [ocupado, setOcupado] = useState(false);

  async function restaurar() {
    setOcupado(true);
    await fetch(`/api/acompanhamentos/${dados.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ arquivado: false }),
    });
    aoMudar();
  }

  return (
    <div className="cartao flex items-center gap-3 px-4 py-3">
      <Icone tamanho="sm" apagado>
        {dados.emoji}
      </Icone>
      <Link href={`/contagem/desde/${dados.id}`} className="min-w-0 flex-1">
        <p className="truncate text-[14px] text-suave">{dados.titulo}</p>
        <p className="text-[12px] text-fantasma">desde {dataLonga(dados.inicio)}</p>
      </Link>
      <button
        type="button"
        onClick={restaurar}
        disabled={ocupado}
        className="shrink-0 rounded-full border border-borda bg-white/[0.04] px-3 py-1.5 text-[12.5px] font-medium text-suave disabled:opacity-50"
      >
        Restaurar
      </button>
    </div>
  );
}

/* ------------------------------ formulário -------------------------------- */

function Opcoes<T extends string>({
  rotulo,
  valor,
  aoMudar,
  itens,
  colunas,
}: {
  rotulo: string;
  valor: T;
  aoMudar: (v: T) => void;
  itens: { id: T; conteudo: React.ReactNode; nome: string }[];
  colunas: string;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-suave">{rotulo}</span>
      <div role="radiogroup" aria-label={rotulo} className={`grid gap-2 ${colunas}`}>
        {itens.map((i) => (
          <button
            key={i.id}
            type="button"
            role="radio"
            aria-checked={valor === i.id}
            aria-label={i.nome}
            onClick={() => aoMudar(i.id)}
            className={`flex min-h-12 items-center justify-center rounded-2xl border px-2 py-2 text-[13.5px] transition-colors ${
              valor === i.id
                ? "border-brand/60 bg-brand/15 text-tinta"
                : "border-borda bg-white/[0.03] text-suave active:bg-white/[0.08]"
            }`}
          >
            {i.conteudo}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Cria e edita. Na edição manda só o que mudou: reenviar a data de início
 * intocada a trataria como correção e reiniciaria a trilha de celebrações.
 */
export function FormAcompanhamento({
  inicial,
  aoSalvar,
}: {
  inicial?: AcompanhamentoDados;
  aoSalvar: () => void;
}) {
  const editando = !!inicial;
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
  const [cat, setCat] = useState(inicial?.categoria ?? "pessoal");
  const [emoji, setEmoji] = useState(inicial?.emoji ?? categoria("pessoal").emoji);
  const [tom, setTom] = useState<Tom>((inicial?.tom as Tom) ?? "magenta");
  const [data, setData] = useState(inicial?.inicioTexto.slice(0, 10) ?? "");
  const [hora, setHora] = useState(editando ? (inicial?.inicioTexto.slice(11, 16) ?? "") : "");
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const def = categoria(cat);
  const hoje = new Date().toISOString().slice(0, 10);

  function escolherCategoria(id: string) {
    setCat(id);
    // Trocar de categoria troca o ícone sugerido, mas só se a pessoa ainda não
    // escolheu um diferente dos sugeridos da categoria antiga.
    if (categoria(cat).emojis.includes(emoji)) setEmoji(categoria(id).emoji);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!data) {
      setErro("Escolha a data de início.");
      return;
    }
    const inicioTexto = hora ? `${data}T${hora}` : data;

    const corpo: Record<string, unknown> = editando
      ? {}
      : { titulo: titulo.trim(), categoria: cat, emoji, tom, descricao: descricao.trim() || null, inicio: inicioTexto };

    if (editando && inicial) {
      if (titulo.trim() !== inicial.titulo) corpo.titulo = titulo.trim();
      if (cat !== inicial.categoria) corpo.categoria = cat;
      if (emoji !== inicial.emoji) corpo.emoji = emoji;
      if (tom !== inicial.tom) corpo.tom = tom;
      if (descricao.trim() !== (inicial.descricao ?? "")) corpo.descricao = descricao.trim() || null;
      // Os dois lados em "AAAA-MM-DDTHH:mm": sem hora, vale meia-noite.
      if (`${data}T${hora || "00:00"}` !== inicial.inicioTexto.slice(0, 16)) {
        corpo.inicio = inicioTexto;
      }
      if (Object.keys(corpo).length === 0) {
        aoSalvar();
        return;
      }
    }

    setOcupado(true);
    try {
      const r = await fetch(editando ? `/api/acompanhamentos/${inicial!.id}` : "/api/acompanhamentos", {
        method: editando ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(corpo),
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
        rotulo="O que você está acompanhando?"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder={def.placeholder}
        maxLength={80}
        required
      />

      <Opcoes
        rotulo="Categoria"
        valor={cat}
        aoMudar={escolherCategoria}
        colunas="grid-cols-2"
        itens={CATEGORIAS.map((c) => ({ id: c.id as string, nome: c.rotulo, conteudo: c.rotulo }))}
      />

      <Opcoes
        rotulo="Ícone"
        valor={emoji}
        aoMudar={setEmoji}
        colunas="grid-cols-6"
        itens={def.emojis.map((e) => ({ id: e, nome: `Ícone ${e}`, conteudo: <span className="text-[22px]">{e}</span> }))}
      />

      <Opcoes
        rotulo="Cor de destaque"
        valor={tom}
        aoMudar={setTom}
        colunas="grid-cols-3"
        itens={TONS.map((t) => ({
          id: t.id,
          nome: t.rotulo,
          conteudo: (
            <span className="flex items-center gap-2">
              <span className={`size-3 rounded-full ${t.id === "magenta" ? "bg-brand" : t.id === "marfim" ? "bg-tinta" : "bg-sucesso"}`} aria-hidden />
              {t.rotulo}
            </span>
          ),
        }))}
      />

      <div className="grid grid-cols-[1fr_auto] gap-2.5">
        <Campo
          rotulo="Data de início"
          type="date"
          value={data}
          max={hoje}
          onChange={(e) => setData(e.target.value)}
          required
        />
        <Campo
          rotulo="Hora (opcional)"
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
        />
      </div>
      <p className="-mt-2 text-[12px] leading-relaxed text-apagado">
        Sem hora, a contagem começa à meia-noite do dia escolhido: “dia 1” é o próprio dia do
        início, e “1 dia completo” só chega 24 horas depois.
      </p>

      <Area
        rotulo="Detalhe (opcional)"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        rows={2}
        maxLength={500}
      />

      {def.aviso && (
        <p className="rounded-2xl border border-borda bg-white/[0.03] px-4 py-3 text-[12.5px] leading-relaxed text-suave">
          {def.aviso}
        </p>
      )}

      <Aviso>{erro}</Aviso>

      <Botao type="submit" carregando={ocupado} className="w-full">
        {editando ? "Salvar alterações" : "Começar a contar"}
      </Botao>
    </form>
  );
}
