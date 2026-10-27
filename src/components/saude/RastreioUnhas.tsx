"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui";
import { CONTEXTOS, ROTULO_CONTEXTO, type Contexto, type ResumoEpisodios, type Semana, type SituacaoMarco } from "@/lib/rastreio/episodios";
import type { AcaoDoMarco } from "@/lib/conhecimento/tipos";
import { chamar, diaCurto, Erro, Escala, Opcoes, Texto } from "./campos";
import { ComoEstou } from "./ComoEstou";

export type DadosUnhas =
  | { estado: "indisponivel" }
  | { estado: "nao-iniciado" }
  | {
      estado: "ativo";
      resumo: ResumoEpisodios;
      marcos: SituacaoMarco[];
      semanas: Semana[];
      contexto: { contexto: string; vezes: number } | null;
      estrategias: { estrategia: string; vezes: number }[];
      eventos: { id: string; tipo: string; dia: string; intensidade: number | null; contexto: string | null; estrategia: string | null; nota: string | null }[];
    };

type Painel = null | "episodio" | "vontade" | "como-estou";

const ROTULO_TIPO: Record<string, string> = { episodio: "Episódio", vontade: "Vontade", dia_sem: "Dia sem roer" };
const pl = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

export function RastreioUnhas({ temaId, dados }: { temaId: string; dados: DadosUnhas }) {
  const router = useRouter();
  const [painel, setPainel] = useState<Painel>(null);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [confirmarApagar, setConfirmarApagar] = useState(false);

  async function acao(fn: () => ReturnType<typeof chamar>) {
    setOcupado(true);
    setErro("");
    const r = await fn();
    setOcupado(false);
    if (!r.ok) {
      setErro(r.erro);
      return false;
    }
    router.refresh();
    return true;
  }

  if (dados.estado === "indisponivel") {
    return (
      <p className="text-[14px] leading-relaxed text-suave">
        O acompanhamento por registros ainda não está disponível nesta instalação: o banco de dados precisa ser atualizado
        pela pessoa que administra o app. O conteúdo abaixo continua disponível.
      </p>
    );
  }

  if (dados.estado === "nao-iniciado") {
    return (
      <div className="space-y-3">
        <p className="text-[14px] leading-relaxed text-suave">
          Se quiser, registre episódios, vontades e dias sem roer. O app conta só o que você informa e diz quando falta
          informação. Nada é obrigatório, e você pode apagar tudo depois.
        </p>
        <Botao onClick={() => acao(() => chamar("/api/habitos", "POST", { temaId }))} carregando={ocupado} type="button">
          Começar a acompanhar
        </Botao>
        <Erro>{erro}</Erro>
      </div>
    );
  }

  const { resumo, marcos, semanas, eventos } = dados;
  const desdeEpisodio = resumo.referencia === "episodio";
  const sustentados = marcos.filter((m) => m.estado === "sustentado");
  const destaque = sustentados[sustentados.length - 1];
  const proximo = marcos.find((m) => m.estado !== "sustentado");

  function aoClicarAcao(a: AcaoDoMarco) {
    if (a === "registrar-gatilho") setPainel("vontade");
    else if (a === "registrar-como-estou") setPainel("como-estou");
    else if (a === "escolher-alternativa") document.getElementById("proximo-passo")?.scrollIntoView({ behavior: "smooth" });
    else if (a === "ver-historico") document.getElementById("historico-unhas")?.scrollIntoView({ behavior: "smooth" });
  }
  const ROTULO_ACAO: Partial<Record<AcaoDoMarco, string>> = {
    "registrar-gatilho": "Registrar um gatilho",
    "escolher-alternativa": "Escolher uma alternativa",
    "registrar-como-estou": "Registrar como estou",
    "ver-historico": "Ver histórico",
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="numeros text-[44px] leading-none font-semibold tracking-tight">{resumo.diasDesdeReferencia}</p>
        <p className="mt-1 text-[14px] text-suave">
          {pl(resumo.diasDesdeReferencia, "dia", "dias")}{" "}
          {desdeEpisodio ? "desde o último episódio que você informou" : "desde que você começou a acompanhar"}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-apagado">
          {pl(resumo.sequenciaConfirmada, "dia confirmado seguido", "dias confirmados seguidos")}
          {resumo.diasSemInformacao > 0 && ` · ${pl(resumo.diasSemInformacao, "dia", "dias")} sem informação`}
        </p>
        {resumo.diasSemInformacao > 0 && (
          <p className="mt-1 text-[12.5px] leading-relaxed text-apagado">
            Dias sem informação não contam como “sem roer”. Confirme os dias que passaram para a contagem refletir o que
            aconteceu.
          </p>
        )}
      </div>

      {destaque && destaque.estado === "sustentado" && (
        <div className="rounded-2xl border border-brand/30 bg-brand/[0.07] p-4">
          <p className="text-[15px] font-semibold">{destaque.titulo}</p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-suave">{destaque.texto}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {destaque.marco.acoes
              .filter((a) => ROTULO_ACAO[a])
              .map((a) => (
                <Botao key={a} variante="vazio" onClick={() => aoClicarAcao(a)} type="button" className="!px-4 !py-2.5 text-[13.5px]">
                  {ROTULO_ACAO[a]}
                </Botao>
              ))}
          </div>
        </div>
      )}
      {!destaque && proximo && (
        <p className="text-[13.5px] leading-relaxed text-apagado">
          Próxima etapa: {proximo.marco.limiar} {proximo.marco.limiar === 1 ? "dia" : "dias"} confirmados. Sem pressa: se
          algum dia não der certo, é parte do caminho e não apaga o que você já registrou.
        </p>
      )}
      {proximo && proximo.estado === "so-tempo" && (
        <p className="text-[13.5px] leading-relaxed text-suave">
          <strong className="font-medium text-tinta">{proximo.titulo}.</strong> {proximo.texto}
        </p>
      )}

      {painel === null && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Botao variante="vazio" onClick={() => setPainel("episodio")} type="button">
            Roí agora
          </Botao>
          <Botao variante="vazio" onClick={() => setPainel("vontade")} type="button">
            Senti vontade
          </Botao>
          <Botao
            variante="vazio"
            carregando={ocupado}
            onClick={() => acao(() => chamar(`/api/habitos/${temaId}/eventos`, "POST", { tipo: "dia_sem" }))}
            type="button"
          >
            Hoje não roí
          </Botao>
        </div>
      )}
      {painel === "episodio" && <FormEvento temaId={temaId} tipo="episodio" aoFechar={() => setPainel(null)} />}
      {painel === "vontade" && <FormEvento temaId={temaId} tipo="vontade" aoFechar={() => setPainel(null)} />}
      {painel === "como-estou" && <ComoEstou aoFechar={() => setPainel(null)} />}
      <Erro>{erro}</Erro>

      <div>
        <h3 className="text-[13px] font-medium text-tinta">Últimas 4 semanas</h3>
        <ul className="mt-2 divide-y divide-borda text-[13.5px]">
          {semanas.map((s) => (
            <li key={s.de} className="flex items-baseline justify-between gap-3 py-2">
              <span className="numeros text-apagado">
                {diaCurto(s.de)}–{diaCurto(s.ate)}
              </span>
              <span className="text-right text-suave">
                {pl(s.episodios, "episódio", "episódios")} · {pl(s.vontades, "vontade", "vontades")}
                {s.diasSemInformacao > 0 && <span className="text-apagado"> · {s.diasSemInformacao} sem info</span>}
              </span>
            </li>
          ))}
        </ul>
        {(dados.contexto || dados.estrategias.length > 0) && (
          <p className="mt-2 text-[13px] leading-relaxed text-apagado">
            {dados.contexto &&
              `Contexto mais registrado: ${ROTULO_CONTEXTO[dados.contexto.contexto as Contexto] ?? dados.contexto.contexto} (${dados.contexto.vezes}×). `}
            {dados.estrategias.length > 0 && `Estratégia mais usada: ${dados.estrategias[0].estrategia} (${dados.estrategias[0].vezes}×). `}
            Isso descreve seus registros; não diz o que causa o quê.
          </p>
        )}
      </div>

      <div id="historico-unhas">
        <h3 className="text-[13px] font-medium text-tinta">Histórico</h3>
        {eventos.length === 0 ? (
          <p className="mt-2 text-[13.5px] text-apagado">Nada registrado ainda.</p>
        ) : (
          <ul className="mt-2 divide-y divide-borda">
            {eventos.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 py-2.5 text-[13.5px]">
                <span className="min-w-0 text-suave">
                  <span className="numeros text-apagado">{diaCurto(e.dia)}</span> · {ROTULO_TIPO[e.tipo] ?? e.tipo}
                  {e.contexto && ` · ${ROTULO_CONTEXTO[e.contexto as Contexto] ?? e.contexto}`}
                  {e.intensidade && ` · intensidade ${e.intensidade}/5`}
                  {e.estrategia && ` · ${e.estrategia}`}
                  {e.nota && <span className="block break-words text-apagado">{e.nota}</span>}
                </span>
                <button
                  type="button"
                  aria-label={`Apagar registro de ${diaCurto(e.dia)}`}
                  onClick={() => acao(() => chamar(`/api/habitos/eventos/${e.id}`, "DELETE"))}
                  className="shrink-0 text-[12.5px] text-perigo/80 active:text-perigo"
                >
                  Apagar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-borda pt-3">
        {confirmarApagar ? (
          <div className="space-y-2.5">
            <p className="text-[13px] leading-relaxed text-perigo">
              Apaga este acompanhamento e todos os registros dele. Não dá para desfazer.
            </p>
            <div className="flex gap-2">
              <Botao variante="fantasma" className="flex-1" type="button" onClick={() => setConfirmarApagar(false)}>
                Cancelar
              </Botao>
              <Botao
                variante="perigo"
                className="flex-1"
                type="button"
                carregando={ocupado}
                onClick={async () => {
                  if (await acao(() => chamar(`/api/habitos/${temaId}`, "DELETE"))) setConfirmarApagar(false);
                }}
              >
                Apagar tudo
              </Botao>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmarApagar(true)} className="text-[13.5px] text-perigo/80 active:text-perigo">
            Apagar este acompanhamento e seus registros
          </button>
        )}
      </div>
    </div>
  );
}

function FormEvento({ temaId, tipo, aoFechar }: { temaId: string; tipo: "episodio" | "vontade"; aoFechar: () => void }) {
  const router = useRouter();
  const [intensidade, setIntensidade] = useState<number | null>(null);
  const [contexto, setContexto] = useState<Contexto | null>(null);
  const [estrategia, setEstrategia] = useState("");
  const [desconforto, setDesconforto] = useState<number | null>(null);
  const [nota, setNota] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function salvar() {
    setOcupado(true);
    setErro("");
    const r = await chamar(`/api/habitos/${temaId}/eventos`, "POST", {
      tipo,
      intensidade,
      contexto,
      estrategia: estrategia.trim() || null,
      desconforto: tipo === "episodio" ? desconforto : null,
      nota: nota.trim() || null,
    });
    setOcupado(false);
    if (!r.ok) return setErro(r.erro);
    router.refresh();
    aoFechar();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-borda bg-white/[0.03] p-4">
      <p className="text-[13.5px] leading-relaxed text-suave">
        {tipo === "episodio"
          ? "Registrar não é falhar: é informação para você. Tudo abaixo é opcional."
          : "Sentir vontade e não roer também é informação. Tudo abaixo é opcional."}
      </p>
      <Escala valor={intensidade} aoMudar={setIntensidade} rotulo="Intensidade da vontade" pontas={["fraca", "forte"]} />
      <Opcoes valor={contexto} aoMudar={setContexto} rotulo="Onde estava?" opcoes={CONTEXTOS.map((c) => ({ id: c, rotulo: ROTULO_CONTEXTO[c] }))} />
      <Texto
        valor={estrategia}
        aoMudar={setEstrategia}
        rotulo={tipo === "episodio" ? "Alguma estratégia que tentou?" : "O que você fez com a vontade?"}
        max={80}
        placeholder="ex.: respirei fundo, usei um fidget"
      />
      {tipo === "episodio" && (
        <Escala valor={desconforto} aoMudar={setDesconforto} rotulo="Desconforto nas unhas ou dedos" pontas={["nenhum", "muito"]} />
      )}
      <Texto valor={nota} aoMudar={setNota} rotulo="Nota (opcional)" max={300} />
      <Erro>{erro}</Erro>
      <div className="flex gap-2">
        <Botao variante="fantasma" className="flex-1" type="button" onClick={aoFechar}>
          Cancelar
        </Botao>
        <Botao className="flex-1" type="button" carregando={ocupado} onClick={salvar}>
          Salvar
        </Botao>
      </div>
    </div>
  );
}
