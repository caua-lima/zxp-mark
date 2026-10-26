"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Botao, BotaoEditar, Brilho, Secao } from "@/components/ui";
import { Trilha } from "@/components/Trilha";
import { Celebracao } from "@/components/Celebracao";
import {
  FormAcompanhamento,
  tomDe,
  useAgora,
  type AcompanhamentoDados,
} from "@/components/Acompanhamentos";
import { categoria, descreverTempo } from "@/lib/acompanhamento";
import { dataLonga } from "@/lib/formato";
import type { PainelProgresso } from "@/lib/painel-progresso";

export function DetalheAcompanhamento({
  dados,
  trilha,
  agora: agoraServidor,
  fuso,
}: {
  dados: AcompanhamentoDados;
  trilha: PainelProgresso;
  agora: number;
  fuso: string;
}) {
  const router = useRouter();
  const agora = useAgora(agoraServidor);
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  const tom = tomDe(dados.tom);
  const cat = categoria(dados.categoria);
  const t = descreverTempo(dados.categoria, new Date(dados.inicio), agora, fuso);
  const arquivado = !!dados.arquivadoEm;

  async function arquivar(valor: boolean) {
    setOcupado(true);
    setErro("");
    const r = await fetch(`/api/acompanhamentos/${dados.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ arquivado: valor }),
    });
    setOcupado(false);
    if (!r.ok) {
      setErro("Não consegui arquivar. Tente de novo.");
      return;
    }
    if (valor) router.replace("/contagem?modo=desde");
    router.refresh();
  }

  async function excluir() {
    setOcupado(true);
    setErro("");
    const r = await fetch(`/api/acompanhamentos/${dados.id}`, { method: "DELETE" });
    if (!r.ok) {
      setOcupado(false);
      setErro("Não consegui apagar. Tente de novo.");
      return;
    }
    router.replace("/contagem?modo=desde");
    router.refresh();
  }

  return (
    <main>
      <header className="mb-5 flex items-center justify-between">
        <Link href="/contagem?modo=desde" className="text-[14px] text-apagado active:text-suave">
          ← Contagem
        </Link>
        <BotaoEditar aoClicar={() => setEditando((v) => !v)} aberto={editando} />
      </header>

      <section className="cartao relative overflow-hidden p-7 text-center">
        <Brilho className="-top-24 left-1/2 size-64 -translate-x-1/2" />
        <div className="relative">
          <span
            className={`mx-auto flex size-14 items-center justify-center rounded-2xl text-3xl ${tom.fundo}`}
            aria-hidden
          >
            {dados.emoji}
          </span>
          <h1 className="mt-3 text-[18px] font-semibold">{dados.titulo}</h1>
          <p className="mt-0.5 text-[12.5px] text-apagado">{cat.rotulo}</p>

          <p
            className={`numeros font-display mt-5 text-[72px] leading-[0.85] font-extrabold ${tom.texto}`}
          >
            {t.heroi.valor}
          </p>
          <p className="mt-2 text-[11px] font-semibold tracking-[0.18em] text-apagado uppercase">
            {t.heroi.unidade === "min" ? "minutos" : t.heroi.unidade}
          </p>

          <p className="mt-4 text-[14px] text-suave">{t.frase}</p>
          <p className="mt-1 text-[13px] text-apagado">
            Hoje é o <span className="numeros font-semibold text-tinta">dia {t.diaN}</span> · desde{" "}
            {dataLonga(dados.inicio)}
          </p>
          {arquivado && (
            <p className="mt-3 inline-block rounded-full border border-borda px-3 py-1 text-[12px] text-fantasma">
              Arquivado
            </p>
          )}
        </div>
      </section>

      {cat.aviso && (
        <p className="mt-3.5 rounded-2xl border border-borda bg-white/[0.03] px-4 py-3 text-[12.5px] leading-relaxed text-suave">
          {cat.aviso}
        </p>
      )}

      {dados.descricao && (
        <p className="cartao mt-3.5 p-5 text-[14px] leading-relaxed text-suave">{dados.descricao}</p>
      )}

      {editando && (
        <section id="editar-acompanhamento" className="cartao surge mt-3.5 p-5">
          <Secao titulo="Editar acompanhamento" />
          <FormAcompanhamento
            inicial={dados}
            aoSalvar={() => {
              setEditando(false);
              router.refresh();
            }}
          />
        </section>
      )}

      <div className="mt-3.5">
        <Trilha progresso={trilha} />
      </div>
      {trilha.celebracao && (
        <Celebracao
          celebracao={trilha.celebracao}
          tipo={trilha.tipo}
          refId={trilha.refId}
          pendentes={trilha.pendentes}
        />
      )}

      <section className="mt-6 space-y-3 border-t border-borda pt-4">
        {erro && (
          <p role="alert" className="text-[13px] text-perigo">
            {erro}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-apagado">
            {arquivado
              ? "Volta para a lista principal."
              : "Arquivar guarda o histórico e tira da lista."}
          </span>
          <button
            type="button"
            onClick={() => arquivar(!arquivado)}
            disabled={ocupado}
            className="shrink-0 rounded-xl border border-borda bg-white/[0.04] px-3.5 py-2 text-[13px] font-medium text-suave disabled:opacity-50"
          >
            {arquivado ? "Restaurar" : "Arquivar"}
          </button>
        </div>

        {confirmando ? (
          <div className="space-y-2.5">
            <p className="text-[13px] leading-relaxed text-perigo">
              Isso apaga este acompanhamento e o histórico dele. Não dá para desfazer.
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
            type="button"
            onClick={() => setConfirmando(true)}
            className="text-[13.5px] text-perigo/80 active:text-perigo"
          >
            Apagar este acompanhamento
          </button>
        )}
      </section>
    </main>
  );
}
