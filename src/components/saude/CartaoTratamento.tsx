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
 * O tratamento na aba Marcos. O contador roda sozinho desde o início, presumindo que você tomou todo dia;
 * só quando esquece é que você marca o dia. Esquecer não derruba nada: o "dia do tratamento" segue, as
 * etapas já vividas continuam, e só a contagem de "dias seguidos sem esquecer" recomeça. Sem culpa.
 */
export function CartaoTratamento({ t, hoje }: { t: TratamentoUI; hoje: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const r = t.resumo;

  async function acao(fn: () => ReturnType<typeof chamar>) {
    setOcupado(true);
    setErro("");
    const res = await fn();
    setOcupado(false);
    if (!res.ok) return setErro(res.erro);
    router.refresh();
  }
  const esqueciHoje = () => acao(() => chamar(`/api/tratamentos/${t.id}/tomadas`, "POST", { estado: "nao_tomou" }));
  const desfazerHoje = () => acao(() => chamar(`/api/tratamentos/${t.id}/tomadas?dia=${hoje}`, "DELETE"));

  const sustentados = t.cartoes.filter((c) => c.estado === "sustentado");
  const destaque = sustentados[sustentados.length - 1];
  const proximo = t.cartoes.find((c) => c.estado !== "sustentado");
  const href = `/temas/${t.medicamentoId}`;
  const ontem = somarDias(hoje, -1);
  const esqueceuHoje = r.hojeEstado === "nao_tomou";

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
        {pl(r.sequenciaConfirmada, "dia seguido", "dias seguidos")} sem esquecer ·{" "}
        {r.totalNaoTomou === 0 ? "nenhum esquecimento marcado" : pl(r.totalNaoTomou, "esquecimento marcado", "esquecimentos marcados")}
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-apagado">Nos dias sem marcação, o app presume que você tomou.</p>

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

      {esqueceuHoje && (
        <p className="mt-3 text-[12.5px] leading-relaxed text-apagado">
          Esquecer acontece, e o tratamento segue contando. Não tome dose dobrada para compensar: veja a bula e, na dúvida, fale com seu
          médico ou farmacêutico.
        </p>
      )}

      {!aberto ? (
        <div className="mt-4 space-y-2">
          {esqueceuHoje ? (
            <Botao type="button" variante="vazio" carregando={ocupado} onClick={desfazerHoje} className="w-full">
              Desfazer: eu tomei hoje
            </Botao>
          ) : (
            <Botao type="button" variante="vazio" carregando={ocupado} onClick={esqueciHoje} className="w-full">
              Esqueci hoje
            </Botao>
          )}
          <button type="button" onClick={() => setAberto(true)} className="text-[13.5px] text-suave underline underline-offset-2 active:text-tinta">
            Esqueci outro dia
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <FormDia id={t.id} inicio={t.inicio} hoje={hoje} diaInicial={ontem >= t.inicio ? ontem : hoje} estadoInicial="nao_tomou" aoFechar={() => setAberto(false)} />
        </div>
      )}
      <Erro>{erro}</Erro>

      <Link href={href} className="mt-3 block text-[13px] text-apagado active:text-suave">
        Dose, efeitos, lembrete e resumo para a consulta ›
      </Link>
    </section>
  );
}
