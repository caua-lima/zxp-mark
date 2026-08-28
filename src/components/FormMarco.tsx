"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Area, Aviso, Botao, Campo } from "@/components/ui";
import { PRESETS, preset as achar } from "@/lib/habitos";

function agoraLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function FormMarco() {
  const router = useRouter();

  const [presetId, setPresetId] = useState("cigarro");
  const [titulo, setTitulo] = useState("");
  const [porque, setPorque] = useState("");
  const [quando, setQuando] = useState<"agora" | "antes">("agora");
  const [inicio, setInicio] = useState(agoraLocal());
  const [unidades, setUnidades] = useState("");
  const [gasto, setGasto] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const p = useMemo(() => achar(presetId), [presetId]);

  function trocarPreset(id: string) {
    setPresetId(id);
    const novo = achar(id);
    setUnidades(novo.unidadesPorDiaPadrao ? String(novo.unidadesPorDiaPadrao) : "");
    setGasto(novo.gastoDiarioPadrao ? String(novo.gastoDiarioPadrao) : "");
  }

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
          titulo: titulo.trim() || p.rotulo,
          preset: presetId,
          emoji: p.emoji,
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
      <section>
        <h2 className="mb-2.5 text-[13px] font-medium text-suave">O que você quer largar?</h2>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((op) => {
            const ativo = op.id === presetId;
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => trocarPreset(op.id)}
                className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                  ativo
                    ? "border-brand/50 bg-brand/10 text-white"
                    : "border-white/8 bg-white/[0.03] text-suave active:bg-white/[0.06]"
                }`}
              >
                <span className="text-lg">{op.emoji}</span>
                <span className="text-[13.5px] leading-tight font-medium">{op.rotulo}</span>
              </button>
            );
          })}
        </div>
      </section>

      <Campo
        rotulo="Nome do marco"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder={p.rotulo}
        maxLength={80}
        dica={`${p.marcos.length} marcos programados para esse hábito.`}
      />

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
                  ? "border-brand/50 bg-brand/10 text-white"
                  : "border-white/8 bg-white/[0.03] text-suave"
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
            placeholder={`${p.unidade}/dia`}
            dica={`${p.unidade} por dia`}
          />
          <Campo
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={gasto}
            onChange={(e) => setGasto(e.target.value)}
            placeholder="R$/dia"
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
