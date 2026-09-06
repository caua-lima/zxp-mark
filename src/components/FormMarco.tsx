"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Area, Aviso, Botao, Campo } from "@/components/ui";
import { PRESETS, preset as achar } from "@/lib/habitos";
import { detectarHabito } from "@/lib/deteccao";

function agoraLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function FormMarco() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [porque, setPorque] = useState("");
  const [quando, setQuando] = useState<"agora" | "antes">("agora");
  const [inicio, setInicio] = useState(agoraLocal());
  const [unidades, setUnidades] = useState("");
  const [gasto, setGasto] = useState("");
  /** null = confia na detecção; string = a pessoa corrigiu à mão */
  const [forcado, setForcado] = useState<string | null>(null);
  const [abrirLista, setAbrirLista] = useState(false);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  // O tipo do hábito sai do que foi escrito. É ele que traz a linha do tempo
  // certa — 27 marcos para cigarro, 22 no genérico.
  const detectado = useMemo(() => detectarHabito(titulo, porque), [titulo, porque]);
  const presetId = forcado ?? detectado.preset;
  const p = useMemo(() => achar(presetId), [presetId]);
  const mostrarDeteccao = titulo.trim().length >= 3;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setOcupado(true);
    try {
      const dataInicio = quando === "agora" ? new Date() : new Date(inicio);
      if (Number.isNaN(dataInicio.getTime())) {
        setErro("Data de início inválida.");
        return;
      }
      if (dataInicio.getTime() > Date.now() + 60_000) {
        setErro("A data de início não pode estar no futuro.");
        return;
      }

      const r = await fetch("/api/marcos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          preset: presetId,
          porque: porque.trim() || undefined,
          cicloInicio: dataInicio.toISOString(),
          unidadesPorDia: unidades ? Number(unidades.replace(",", ".")) : null,
          gastoDiario: gasto ? Number(gasto.replace(",", ".")) : null,
        }),
      });
      const dados = await r.json();
      if (!r.ok) {
        setErro(dados.erro ?? "Não consegui criar o marco.");
        return;
      }
      router.replace(`/marcos/${dados.marco.id}`);
      router.refresh();
    } catch {
      setErro("Sem conexão com o servidor.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      <div>
        <div className="flex items-end gap-3">
          <div className="flex size-[52px] shrink-0 items-center justify-center rounded-2xl border border-borda bg-white/[0.03] text-2xl">
            {mostrarDeteccao ? p.emoji : "✍️"}
          </div>
          <div className="min-w-0 flex-1">
            <Campo
              rotulo="O que você quer largar?"
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                setForcado(null);
              }}
              placeholder="Escreve com as suas palavras"
              maxLength={80}
              autoFocus
              required
            />
          </div>
        </div>

        {mostrarDeteccao && (
          <div className="surge mt-2.5 rounded-2xl border border-borda bg-white/[0.03] px-4 py-3">
            <p className="text-[13px] leading-relaxed text-suave">
              {forcado || detectado.reconhecido ? (
                <>
                  Reconheci como <span className="font-medium text-brand">{p.rotulo}</span> —{" "}
                  <span className="numeros">{p.marcos.length}</span> marcos programados, com a
                  linha do tempo desse hábito.
                </>
              ) : (
                <>
                  Não é um hábito que eu conheça de cor, então vou usar a linha do tempo geral:{" "}
                  <span className="numeros">{p.marcos.length}</span> marcos, de 1 hora a 10 anos.
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => setAbrirLista((v) => !v)}
              className="mt-1.5 text-[12.5px] text-apagado underline underline-offset-2 active:text-suave"
            >
              {abrirLista ? "Fechar" : "Não é isso?"}
            </button>

            {abrirLista && (
              <div className="surge mt-3 grid grid-cols-2 gap-2">
                {PRESETS.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => {
                      setForcado(op.id);
                      setAbrirLista(false);
                    }}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      op.id === presetId
                        ? "border-brand/50 bg-brand/10 text-tinta"
                        : "border-borda bg-white/[0.02] text-suave"
                    }`}
                  >
                    <span>{op.emoji}</span>
                    <span className="text-[12.5px] leading-tight">{op.rotulo}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <section>
        <h2 className="mb-2.5 text-[13px] font-medium text-suave">Quando começou?</h2>
        <div className="flex gap-2">
          {(
            [
              ["agora", "Agora mesmo"],
              ["antes", "Já faz um tempo"],
            ] as const
          ).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setQuando(valor)}
              className={`flex-1 rounded-2xl border px-4 py-3 text-[14px] font-medium transition-colors ${
                quando === valor
                  ? "border-brand/50 bg-brand/10 text-tinta"
                  : "border-borda bg-white/[0.03] text-apagado"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>
        {quando === "antes" && (
          <div className="mt-2.5">
            <Campo
              type="datetime-local"
              value={inicio}
              max={agoraLocal()}
              onChange={(e) => setInicio(e.target.value)}
              dica="Vale a última vez que você cedeu — o cronômetro conta a partir dali."
            />
          </div>
        )}
      </section>

      <Area
        rotulo="Por que você quer isso?"
        value={porque}
        onChange={(e) => setPorque(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Escreva com suas palavras. Vou te lembrar disso quando a vontade bater."
        dica="Opcional, mas é o que mais ajuda nos momentos difíceis."
      />

      <section className="space-y-2.5">
        <h2 className="text-[13px] font-medium text-suave">
          Quanto isso te custava? <span className="text-fantasma">(opcional)</span>
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          <Campo
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={unidades}
            onChange={(e) => setUnidades(e.target.value)}
            placeholder={p.unidadesPorDiaPadrao ? String(p.unidadesPorDiaPadrao) : "0"}
            dica={`${p.unidade} por dia`}
          />
          <Campo
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={gasto}
            onChange={(e) => setGasto(e.target.value)}
            placeholder={p.gastoDiarioPadrao ? String(p.gastoDiarioPadrao) : "0"}
            dica="reais por dia"
          />
        </div>
      </section>

      <Aviso>{erro}</Aviso>

      <Botao type="submit" carregando={ocupado} className="w-full">
        Começar a contar
      </Botao>
    </form>
  );
}
