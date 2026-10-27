"use client";

import { useState } from "react";
import { Chave } from "@/components/ui";

/**
 * Consentimento do assistente. Começa DESLIGADO. A tela diz o que ele lê quando ligado,
 * se algum provedor externo receberia trechos disso, e como apagar.
 */
export function CartaoAssistenteSaude({
  inicial,
  provedorExterno,
  rotuloProvedor,
}: {
  inicial: boolean;
  provedorExterno: boolean;
  rotuloProvedor: string;
}) {
  const [ligado, setLigado] = useState(inicial);
  const [erro, setErro] = useState("");
  const [apagando, setApagando] = useState<"" | "confirmar" | "feito" | "ocupado">("");

  async function alternar(v: boolean) {
    const antes = ligado;
    setLigado(v);
    setErro("");
    const r = await fetch("/api/preferencias-saude", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assistenteUsaSaude: v }),
    }).catch(() => null);
    if (!r || !r.ok) {
      setLigado(antes);
      setErro((await r?.json().catch(() => null))?.erro ?? "Não consegui salvar.");
    }
  }

  async function apagar() {
    setApagando("ocupado");
    const r = await fetch("/api/preferencias-saude", { method: "DELETE" }).catch(() => null);
    if (!r || !r.ok) {
      setErro("Não consegui apagar. Tente de novo.");
      setApagando("");
      return;
    }
    setLigado(false);
    setApagando("feito");
  }

  return (
    <section className="cartao p-5" aria-labelledby="titulo-assistente-saude">
      <h2 id="titulo-assistente-saude" className="text-[15px] font-semibold">
        Assistente e saúde
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed text-apagado">
        Por padrão, o assistente <strong className="text-suave">não lê nada</strong> do que você registra sobre
        medicamento, hábitos como roer unhas, humor e sono. Se você ligar, ele usa só os registros necessários para
        cada pergunta, nunca o histórico inteiro, e diz quando algo vem dos seus registros.
      </p>

      <div className="mt-2 divide-y divide-white/6">
        <Chave
          ligado={ligado}
          aoMudar={alternar}
          rotulo="Permitir que o assistente use meus registros de saúde"
          descricao="Você pode desligar quando quiser."
        />
      </div>

      {provedorExterno && (
        <p className="mt-2 rounded-2xl border border-borda bg-white/[0.03] px-4 py-3 text-[12.5px] leading-relaxed text-suave">
          Há um provedor de IA externo ativo ({rotuloProvedor}). Com isto ligado, os trechos relevantes dos seus
          registros são enviados a ele para gerar a resposta. Com o motor local, nada sai do servidor do app.
        </p>
      )}

      {erro && (
        <p role="alert" className="mt-2 text-[13px] text-perigo">
          {erro}
        </p>
      )}

      <div className="mt-3 border-t border-borda pt-3">
        {apagando === "confirmar" ? (
          <div className="space-y-2.5">
            <p className="text-[13px] leading-relaxed text-perigo">
              Isso apaga os seus acompanhamentos de hábito, de medicamento (tomadas, doses e efeitos) e os registros de
              “como estou”. Sono, contagens e marcos não são afetados. Não dá para desfazer.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setApagando("")} className="flex-1 rounded-2xl px-4 py-3 text-[14px] text-suave">
                Cancelar
              </button>
              <button type="button" onClick={apagar} className="flex-1 rounded-2xl bg-perigo/15 px-4 py-3 text-[14px] font-medium text-perigo">
                Apagar tudo
              </button>
            </div>
          </div>
        ) : apagando === "feito" ? (
          <p role="status" className="text-[13px] text-sucesso">
            Dados de saúde apagados e uso pelo assistente desligado. ✓
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setApagando("confirmar")}
            disabled={apagando === "ocupado"}
            className="text-[13.5px] text-perigo/80 active:text-perigo disabled:opacity-50"
          >
            Apagar meus dados de saúde
          </button>
        )}
      </div>
    </section>
  );
}
