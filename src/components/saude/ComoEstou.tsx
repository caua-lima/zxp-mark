"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui";
import { chamar, Erro, Escala, Texto } from "./campos";

/**
 * “Como estou”: o que a PESSOA percebe, nas palavras e na escala dela. É um registro de
 * percepção, nunca um diagnóstico nem uma medida de tratamento. Um por dia; repetir edita.
 */
export function ComoEstou({ aoFechar }: { aoFechar: () => void }) {
  const router = useRouter();
  const [humor, setHumor] = useState<number | null>(null);
  const [energia, setEnergia] = useState<number | null>(null);
  const [ansiedade, setAnsiedade] = useState<number | null>(null);
  const [nota, setNota] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function salvar() {
    if (humor === null) {
      setErro("Escolha de 1 a 5 como está seu humor hoje.");
      return;
    }
    setOcupado(true);
    setErro("");
    const r = await chamar("/api/humor", "POST", { humor, energia, ansiedade, nota: nota.trim() || null });
    setOcupado(false);
    if (!r.ok) return setErro(r.erro);
    router.refresh();
    aoFechar();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-borda bg-white/[0.03] p-4">
      <p className="text-[13.5px] leading-relaxed text-suave">
        Só o que você percebe, do seu jeito. Um registro por dia; se registrar de novo, ele é atualizado.
      </p>
      <Escala valor={humor} aoMudar={setHumor} rotulo="Humor" pontas={["muito baixo", "muito bom"]} />
      <Escala valor={energia} aoMudar={setEnergia} rotulo="Energia (opcional)" pontas={["pouca", "muita"]} />
      <Escala valor={ansiedade} aoMudar={setAnsiedade} rotulo="Ansiedade (opcional)" pontas={["nenhuma", "muita"]} />
      <Texto valor={nota} aoMudar={setNota} rotulo="Algo mais? (opcional)" max={300} />
      <Erro>{erro}</Erro>
      <div className="flex gap-2">
        <Botao variante="fantasma" onClick={aoFechar} className="flex-1" type="button">
          Cancelar
        </Botao>
        <Botao onClick={salvar} carregando={ocupado} className="flex-1" type="button">
          Salvar
        </Botao>
      </div>
    </div>
  );
}
