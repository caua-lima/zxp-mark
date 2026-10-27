"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui";
import { somarDias } from "@/lib/rastreio/episodios";
import { chamar, diaCurto, Erro } from "./campos";
import { FormDia, type TratamentoUI } from "./RastreioTratamento";

const pl = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

/**
 * O tratamento na aba Marcos. O que importa aqui é que ESQUECER UM DIA não derruba nada:
 * o "dia do tratamento" segue contando, as etapas já vividas continuam, e só a sequência
 * de tomadas confirmadas recomeça — o dia fica registrado como “não tomei”, sem culpa.
 */
export function CartaoTratamento({ t, hoje }: { t: TratamentoUI; hoje: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const r = t.resumo;

  async function marcar(estado: "tomou" | "nao_tomou") {
    setOcupado(true);
    setErro("");
    const res = await chamar(`/api/tratamentos/${t.id}/tomadas`, "POST", { estado });
    setOcupado(false);
    if (!res.ok) return setErro(res.erro);
    router.refresh();
  }

  const sustentados = t.cartoes.filter((c) => c.estado === "sustentado");
  const destaque = sustentados[sustentados.length - 1];
  const proximo = t.cartoes.find((c) => c.estado !== "sustentado");
  const href = t.medicamentoId === "outro" ? "/temas" : `/temas/${t.medicamentoId}`;
  const ontem = somarDias(hoje, -1);

  return (
    <section className="cartao p-5" aria-label={`Tratamento: ${t.nome}`}>
      <Link href={href} className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tracking-[0.12em] text-brand uppercase">Tratamento</p>
          <p className="mt-1 truncate text-[17px] font-semibold">{t.nome}</p>
          <p className="mt-0.5 text-[13px] text-apagado">
            desde {diaCurto(t.inicio)}
            {r.doseAtual ? ` · dose informada: ${r.doseAtual.descricao}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="numeros text-[30px] leading-none font-semibold">{r.desdeInicio.diaN}</p>
          <p className="mt-1 text-[12px] text-apagado">dia do tratamento</p>
        </div>
      </Link>

      <p className="mt-3 text-[13px] leading-relaxed text-suave">
        {pl(r.sequenciaConfirmada, "dia seguido", "dias seguidos")} com tomada confirmada · {pl(r.totalRegistrados, "dia", "dias")} com registro
        {r.diasSemInformacao > 0 && ` · ${pl(r.diasSemInformacao, "dia", "dias")} sem informação`}
      </p>

      {destaque && destaque.estado === "sustentado" && (
        <div className="mt-3 rounded-2xl border border-brand/30 bg-brand/[0.07] p-3.5">
          <p className="text-[14.5px] font-semibold">{destaque.titulo}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-suave">{destaque.texto}</p>
        </div>
      )}
      {proximo && proximo.estado === "so-tempo" && (
        <p className="mt-3 text-[13px] leading-relaxed text-suave">
          <strong className="font-medium text-tinta">{proximo.titulo}.</strong> {proximo.texto}
        </p>
      )}

      {r.hojeEstado === "nao_tomou" && (
        <p className="mt-3 text-[12.5px] leading-relaxed text-apagado">
          Esquecer acontece, e o tratamento segue contando. Não tome dose dobrada para compensar: veja a bula e, na dúvida, fale com seu
          médico ou farmacêutico.
        </p>
      )}

      {!aberto ? (
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Botao type="button" variante={r.hojeEstado === "tomou" ? "cheio" : "vazio"} carregando={ocupado} aria-pressed={r.hojeEstado === "tomou"} onClick={() => marcar("tomou")}>
              Tomei hoje
            </Botao>
            <Botao type="button" variante={r.hojeEstado === "nao_tomou" ? "cheio" : "vazio"} carregando={ocupado} aria-pressed={r.hojeEstado === "nao_tomou"} onClick={() => marcar("nao_tomou")}>
              Esqueci hoje
            </Botao>
          </div>
          <button type="button" onClick={() => setAberto(true)} className="text-[13.5px] text-suave underline underline-offset-2 active:text-tinta">
            Esqueci um dia (ou esqueci de registrar)
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <FormDia id={t.id} inicio={t.inicio} hoje={hoje} diaInicial={ontem >= t.inicio ? ontem : hoje} estadoInicial="nao_tomou" aoFechar={() => setAberto(false)} />
        </div>
      )}
      <Erro>{erro}</Erro>
    </section>
  );
}
