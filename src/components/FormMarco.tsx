"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Area, Aviso, Botao, Campo, Secao } from "@/components/ui";
import { PRESETS, preset as achar } from "@/lib/habitos";
import { detectarHabito } from "@/lib/deteccao";
import { TEMAS } from "@/lib/conhecimento/catalogo";
import { normalizar, reconhecer } from "@/lib/conhecimento/indice";

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
  const [dose, setDose] = useState("");
  /** o app achou que o nome é um erro de digitação e perguntou; só salva depois do "sim" */
  const [sugestao, setSugestao] = useState<string | null>(null);

  // O tipo do hábito sai do que foi escrito. É ele que traz a linha do tempo
  // certa — 27 marcos para cigarro, 22 no genérico.
  const detectado = useMemo(() => detectarHabito(titulo, porque), [titulo, porque]);
  const presetId = forcado ?? detectado.preset;
  const p = useMemo(() => achar(presetId), [presetId]);
  const mostrarDeteccao = titulo.trim().length >= 3;
  // Remédio é uma categoria como as outras, mas em vez de "tempo sem" ele conta os dias do tratamento
  // e deixa marcar "tomei" ou "esqueci". Reconhece pelo nome do remédio (inclusive com erro de digitação)
  // ou pelas palavras "remédio", "medicamento", "tratamento".
  const remedioDetectado = useMemo(() => {
    if (titulo.trim().length < 3) return false;
    const r = reconhecer(titulo, TEMAS.filter((t) => t.categoria === "medicamento"));
    if (r && (r.tipo === "exato" || r.tipo === "incerto" || r.tipo === "outro-medicamento")) return true;
    const n = ` ${normalizar(titulo)} `;
    return ["remedio", "medicamento", "tratamento", "comprimido", "antidepressivo"].some((w) => n.includes(` ${w} `));
  }, [titulo]);
  const ehRemedio = forcado === "remedio" || (forcado === null && remedioDetectado);

  /** Remédio vira um acompanhamento de tratamento; nome ambíguo pergunta antes de salvar. */
  async function salvarRemedio(confirmouSugestao: boolean) {
    try {
      const dia = (quando === "agora" ? agoraLocal() : inicio).slice(0, 10);
      const r = await fetch("/api/tratamentos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nome: titulo.trim(),
          confirmouSugestao,
          inicio: dia,
          dose: dose.trim() ? { descricao: dose.trim() } : undefined,
        }),
      });
      const dados = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 409 && typeof dados.confirmar === "string") return setSugestao(dados.confirmar);
        return setErro(dados.erro ?? "Não consegui salvar.");
      }
      router.replace("/marcos");
      router.refresh();
    } catch {
      setErro("Sem conexão com o servidor.");
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSugestao(null);
    setOcupado(true);
    if (ehRemedio) {
      await salvarRemedio(false);
      setOcupado(false);
      return;
    }
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
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-borda bg-white/[0.03] text-2xl">
            {mostrarDeteccao ? (ehRemedio ? "💊" : p.emoji) : "✍️"}
          </div>
          <div className="min-w-0 flex-1">
            <Campo
              rotulo={ehRemedio ? "Qual é o remédio?" : "O que você quer largar?"}
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
              {ehRemedio ? (
                <>
                  Reconheci como <span className="font-medium text-brand">Remédio / tratamento</span> — vou contar os dias do
                  tratamento e você marca “tomei” ou “esqueci”. Esquecer um dia não zera nada.
                </>
              ) : forcado || detectado.reconhecido ? (
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
                <button
                  type="button"
                  onClick={() => {
                    setForcado("remedio");
                    setAbrirLista(false);
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    ehRemedio ? "border-brand/50 bg-brand/10 text-tinta" : "border-borda bg-white/[0.02] text-suave"
                  }`}
                >
                  <span>💊</span>
                  <span className="text-[12.5px] leading-tight">Remédio / tratamento</span>
                </button>
                {PRESETS.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => {
                      setForcado(op.id);
                      setAbrirLista(false);
                    }}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      !ehRemedio && op.id === presetId
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
        <Secao titulo="Quando começou?" />
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
              dica={ehRemedio ? "O dia em que o tratamento começou, como você lembra." : "Vale a última vez que você cedeu — o cronômetro conta a partir dali."}
            />
          </div>
        )}
      </section>

      {ehRemedio ? (
        <section className="space-y-3">
          <Campo
            rotulo="Dose, como está na sua prescrição (opcional)"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            maxLength={40}
            placeholder="ex.: 10 mg"
            dica="Fica só na sua conta. O app guarda o que você informa: não indica, não ajusta e não avalia dose."
          />
          {sugestao && (
            <div role="alert" className="rounded-2xl border border-brand/30 bg-brand/[0.07] p-4 text-[13.5px] leading-relaxed text-suave">
              Você quis dizer <strong className="text-tinta">{sugestao}</strong>? Só salvo com esse nome se você confirmar.
              <div className="mt-2.5 flex gap-2">
                <Botao
                  type="button"
                  className="!px-4 !py-2.5 text-[13.5px]"
                  carregando={ocupado}
                  onClick={async () => {
                    setOcupado(true);
                    setSugestao(null);
                    await salvarRemedio(true);
                    setOcupado(false);
                  }}
                >
                  Sim, é {sugestao}
                </Botao>
                <Botao type="button" variante="vazio" className="!px-4 !py-2.5 text-[13.5px]" onClick={() => setSugestao(null)}>
                  Não, vou corrigir
                </Botao>
              </div>
            </div>
          )}
        </section>
      ) : (
        <>
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
          <Secao
            titulo="Quanto isso te custava?"
            acao={<span className="text-[11px] text-fantasma">opcional</span>}
            className="mb-0"
          />
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
        </>
      )}

      <Aviso>{erro}</Aviso>

      <Botao type="submit" carregando={ocupado} className="w-full">
        {ehRemedio ? "Começar a acompanhar" : "Começar a contar"}
      </Botao>
    </form>
  );
}
