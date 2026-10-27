"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui";
import type { ResumoTratamento, SituacaoCartao } from "@/lib/rastreio/medicamento";
import type { AcaoDoMarco } from "@/lib/conhecimento/tipos";
import { chamar, diaCurto, Erro, Opcoes, Texto } from "./campos";
import { ComoEstou } from "./ComoEstou";

export type TratamentoUI = {
  id: string;
  nome: string;
  inicio: string;
  horario: string | null;
  /** o conteúdo do catálogo se aplica a este medicamento */
  doCatalogo: boolean;
  resumo: ResumoTratamento;
  cartoes: SituacaoCartao[];
  doses: { id: string; descricao: string; desdeDia: string; nota: string | null }[];
  efeitos: { id: string; dia: string; descricao: string; intensidade: number | null }[];
  tomadasRecentes: { dia: string; estado: string }[];
  resumoParaConsulta: string;
};

export type DadosTratamentoUI =
  | { estado: "indisponivel" }
  | { estado: "pronto"; tratamentos: TratamentoUI[]; hoje: string };

const INTENSIDADE = [
  { id: "1", rotulo: "Leve" },
  { id: "2", rotulo: "Moderado" },
  { id: "3", rotulo: "Forte" },
] as const;

const pl = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

export function RastreioTratamento({
  tituloTema,
  dados,
}: {
  tituloTema: string;
  dados: DadosTratamentoUI;
}) {
  if (dados.estado === "indisponivel") {
    return (
      <p className="text-[14px] leading-relaxed text-suave">
        O acompanhamento por registros ainda não está disponível nesta instalação: o banco de dados precisa ser atualizado
        pela pessoa que administra o app. O conteúdo abaixo continua disponível.
      </p>
    );
  }
  const daqui = dados.tratamentos.filter((t) => t.doCatalogo);
  const outros = dados.tratamentos.filter((t) => !t.doCatalogo);

  return (
    <div className="space-y-6">
      {daqui.map((t) => (
        <Ativo key={t.id} t={t} hoje={dados.hoje} />
      ))}
      {daqui.length === 0 && <Novo tituloTema={tituloTema} hoje={dados.hoje} />}
      {outros.length > 0 && <Outros lista={outros} />}
    </div>
  );
}

/* --------------------------------- criar ---------------------------------- */

function Novo({ tituloTema, hoje }: { tituloTema: string; hoje: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [inicio, setInicio] = useState("");
  const [horario, setHorario] = useState("");
  const [dose, setDose] = useState("");
  const [doseDesde, setDoseDesde] = useState("");
  const [sugestao, setSugestao] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function salvar(confirmouSugestao = false) {
    setOcupado(true);
    setErro("");
    setAviso("");
    const r = await chamar("/api/tratamentos", "POST", {
      nome,
      confirmouSugestao,
      inicio,
      horario: horario || null,
      dose: dose.trim() ? { descricao: dose.trim(), desde: doseDesde || inicio } : undefined,
    });
    setOcupado(false);
    if (!r.ok) {
      if (r.status === 409 && typeof r.dados.confirmar === "string") {
        setSugestao(r.dados.confirmar);
        return;
      }
      return setErro(r.erro);
    }
    const t = r.dados.tratamento as { medicamentoId?: string } | undefined;
    if (t?.medicamentoId === "outro") {
      setAviso("Salvei como outro medicamento: o conteúdo desta página não se aplica a ele.");
    }
    setSugestao(null);
    setAberto(false);
    router.refresh();
  }

  if (!aberto) {
    return (
      <div className="space-y-3">
        <p className="text-[14px] leading-relaxed text-suave">
          Se você usa {tituloTema} por prescrição, pode registrar quando começou e se tomou a cada dia. O app guarda o que
          você informa; <strong className="font-medium text-tinta">não indica, não ajusta e não avalia dose</strong>.
        </p>
        <Botao type="button" onClick={() => setAberto(true)}>
          Começar a acompanhar
        </Botao>
        {aviso && <p className="text-[13px] text-suave">{aviso}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-borda bg-white/[0.03] p-4">
      <Texto valor={nome} aoMudar={(v) => { setNome(v); setSugestao(null); }} rotulo="Nome do medicamento" max={60} placeholder={tituloTema.toLowerCase()} />
      {sugestao && (
        <div role="alert" className="rounded-xl border border-brand/30 bg-brand/[0.07] p-3 text-[13.5px] leading-relaxed text-suave">
          Você quis dizer <strong className="text-tinta">{sugestao}</strong>? Só salvo com esse nome se você confirmar.
          <div className="mt-2 flex gap-2">
            <Botao type="button" className="!px-4 !py-2.5 text-[13.5px]" onClick={() => salvar(true)} carregando={ocupado}>
              Sim, é {sugestao}
            </Botao>
            <Botao type="button" variante="vazio" className="!px-4 !py-2.5 text-[13.5px]" onClick={() => setSugestao(null)}>
              Não, vou corrigir
            </Botao>
          </div>
        </div>
      )}
      <label className="block">
        <span className="text-[13px] text-suave">Quando o tratamento começou</span>
        <input
          type="date"
          value={inicio}
          max={hoje}
          onChange={(e) => setInicio(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-borda bg-white/[0.04] px-3.5 py-3 text-[15px] text-tinta focus:border-brand/60 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-[13px] text-suave">Horário previsto (opcional)</span>
        <input
          type="time"
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-borda bg-white/[0.04] px-3.5 py-3 text-[15px] text-tinta focus:border-brand/60 focus:outline-none"
        />
      </label>
      <Texto valor={dose} aoMudar={setDose} rotulo="Dose, como está na sua prescrição (opcional)" max={40} placeholder="ex.: 10 mg" />
      {dose.trim() && (
        <label className="block">
          <span className="text-[13px] text-suave">Desde quando nesta dose (se for diferente do início)</span>
          <input
            type="date"
            value={doseDesde}
            min={inicio || undefined}
            max={hoje}
            onChange={(e) => setDoseDesde(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-borda bg-white/[0.04] px-3.5 py-3 text-[15px] text-tinta focus:border-brand/60 focus:outline-none"
          />
        </label>
      )}
      <p className="text-[12.5px] leading-relaxed text-apagado">
        A dose fica só na sua conta. O app a guarda para você e não a usa para calcular nada.
      </p>
      <Erro>{erro}</Erro>
      <div className="flex gap-2">
        <Botao type="button" variante="fantasma" className="flex-1" onClick={() => setAberto(false)}>
          Cancelar
        </Botao>
        <Botao type="button" className="flex-1" carregando={ocupado} onClick={() => salvar(false)}>
          Salvar
        </Botao>
      </div>
    </div>
  );
}

/* --------------------------------- ativo ---------------------------------- */

function Contador({ valor, rotulo, detalhe }: { valor: string; rotulo: string; detalhe?: string }) {
  return (
    <div className="rounded-2xl border border-borda bg-white/[0.03] p-3.5">
      <p className="numeros text-[26px] leading-none font-semibold">{valor}</p>
      <p className="mt-1.5 text-[12.5px] leading-snug text-suave">{rotulo}</p>
      {detalhe && <p className="mt-0.5 text-[11.5px] leading-snug text-apagado">{detalhe}</p>}
    </div>
  );
}

function Ativo({ t, hoje }: { t: TratamentoUI; hoje: string }) {
  const router = useRouter();
  const [painel, setPainel] = useState<null | "como-estou" | "efeito" | "dose" | "dia">(null);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [apagar, setApagar] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const r = t.resumo;

  async function acao(fn: () => ReturnType<typeof chamar>) {
    setOcupado(true);
    setErro("");
    const res = await fn();
    setOcupado(false);
    if (!res.ok) {
      setErro(res.erro);
      return false;
    }
    router.refresh();
    return true;
  }
  const tomada = (estado: "tomou" | "nao_tomou", dia?: string) =>
    acao(() => chamar(`/api/tratamentos/${t.id}/tomadas`, "POST", { estado, dia }));

  const sustentados = t.cartoes.filter((c) => c.estado === "sustentado");
  const destaque = sustentados[sustentados.length - 1];
  const proximo = t.cartoes.find((c) => c.estado !== "sustentado");
  const detalheDose = r.doseAtual ? `${t.nome} · dose informada: ${r.doseAtual.descricao}` : t.nome;

  function aoClicarAcao(a: AcaoDoMarco) {
    if (a === "registrar-como-estou") setPainel("como-estou");
    else if (a === "registrar-efeito") setPainel("efeito");
    else if (a === "ver-historico") document.getElementById(`historico-${t.id}`)?.scrollIntoView({ behavior: "smooth" });
    else if (a === "preparar-consulta") document.getElementById(`consulta-${t.id}`)?.scrollIntoView({ behavior: "smooth" });
  }
  const ROTULO_ACAO: Partial<Record<AcaoDoMarco, string>> = {
    "registrar-como-estou": "Registrar como estou",
    "registrar-efeito": "Registrar um efeito",
    "ver-historico": "Ver histórico",
    "preparar-consulta": "Preparar para a consulta",
  };

  return (
    <section className="space-y-5" aria-label={`Acompanhamento de ${t.nome}`}>
      <div className="grid grid-cols-2 gap-2.5">
        <Contador valor={String(r.desdeInicio.diaN)} rotulo="Dia do tratamento" detalhe={`desde ${diaCurto(t.inicio)}`} />
        <Contador
          valor={r.doseAtual ? String(r.doseAtual.contagem.diaN) : "—"}
          rotulo="Dia na dose informada"
          detalhe={r.doseAtual ? `${r.doseAtual.descricao}, desde ${diaCurto(r.doseAtual.desdeDia)}` : "nenhuma dose informada"}
        />
        <Contador valor={String(r.sequenciaConfirmada)} rotulo="Dias seguidos com tomada confirmada" />
        <Contador
          valor={String(r.totalRegistrados)}
          rotulo="Dias com registro"
          detalhe={r.diasSemInformacao > 0 ? `${pl(r.diasSemInformacao, "dia", "dias")} sem informação` : undefined}
        />
      </div>
      <p className="text-[12.5px] leading-relaxed text-apagado">
        São contagens separadas. Mudar de dose não reinicia nenhuma delas, e dias sem informação não contam como tomada.
      </p>

      {destaque && destaque.estado === "sustentado" && (
        <div className="rounded-2xl border border-brand/30 bg-brand/[0.07] p-4">
          <p className="text-[15px] font-semibold">{destaque.titulo}</p>
          <p className="mt-0.5 text-[12.5px] text-apagado">{detalheDose}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-suave">{destaque.texto}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {destaque.marco.acoes
              .filter((a) => ROTULO_ACAO[a])
              .map((a) => (
                <Botao key={a} variante="vazio" type="button" onClick={() => aoClicarAcao(a)} className="!px-4 !py-2.5 text-[13.5px]">
                  {ROTULO_ACAO[a]}
                </Botao>
              ))}
          </div>
        </div>
      )}
      {proximo && proximo.estado === "so-tempo" && (
        <div className="rounded-2xl border border-borda bg-white/[0.03] p-4">
          <p className="text-[14.5px] font-medium">{proximo.titulo}</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-suave">{proximo.texto}</p>
        </div>
      )}
      {proximo && proximo.estado === "futuro" && !destaque && (
        <p className="text-[13.5px] leading-relaxed text-apagado">
          Próxima etapa de leitura: dia {proximo.marco.limiar}. É conteúdo educativo sobre o que costuma acontecer, não um
          resultado seu.
        </p>
      )}

      <div>
        <p className="text-[13.5px] font-medium">Hoje</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Botao
            type="button"
            variante={r.hojeEstado === "tomou" ? "cheio" : "vazio"}
            carregando={ocupado}
            onClick={() => tomada("tomou")}
            aria-pressed={r.hojeEstado === "tomou"}
          >
            Tomei
          </Botao>
          <Botao
            type="button"
            variante={r.hojeEstado === "nao_tomou" ? "cheio" : "vazio"}
            carregando={ocupado}
            onClick={() => tomada("nao_tomou")}
            aria-pressed={r.hojeEstado === "nao_tomou"}
          >
            Não tomei
          </Botao>
        </div>
        {r.hojeEstado === null && <p className="mt-1.5 text-[12.5px] text-apagado">Sem informação para hoje.</p>}
        {r.hojeEstado === "nao_tomou" && (
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-apagado">
            Esquecer acontece. Não tome dose dobrada para compensar; veja a bula e, na dúvida, fale com seu médico ou
            farmacêutico.
          </p>
        )}
      </div>

      {painel === null ? (
        <div className="flex flex-wrap gap-2">
          <Botao type="button" variante="vazio" className="!px-4 !py-2.5 text-[13.5px]" onClick={() => setPainel("dia")}>
            Registrar outro dia
          </Botao>
          <Botao type="button" variante="vazio" className="!px-4 !py-2.5 text-[13.5px]" onClick={() => setPainel("como-estou")}>
            Registrar como estou
          </Botao>
          <Botao type="button" variante="vazio" className="!px-4 !py-2.5 text-[13.5px]" onClick={() => setPainel("efeito")}>
            Registrar um efeito
          </Botao>
          <Botao type="button" variante="vazio" className="!px-4 !py-2.5 text-[13.5px]" onClick={() => setPainel("dose")}>
            Informar dose
          </Botao>
        </div>
      ) : painel === "como-estou" ? (
        <ComoEstou aoFechar={() => setPainel(null)} />
      ) : painel === "efeito" ? (
        <FormEfeito id={t.id} inicio={t.inicio} hoje={hoje} aoFechar={() => setPainel(null)} />
      ) : painel === "dose" ? (
        <FormDose id={t.id} inicio={t.inicio} hoje={hoje} aoFechar={() => setPainel(null)} />
      ) : (
        <FormDia id={t.id} inicio={t.inicio} hoje={hoje} aoFechar={() => setPainel(null)} />
      )}
      <Erro>{erro}</Erro>

      <div id={`historico-${t.id}`} className="space-y-4">
        <div>
          <h3 className="text-[13px] font-medium text-tinta">Últimos registros</h3>
          {t.tomadasRecentes.length === 0 ? (
            <p className="mt-2 text-[13.5px] text-apagado">Nada registrado ainda.</p>
          ) : (
            <ul className="mt-2 divide-y divide-borda">
              {t.tomadasRecentes.map((d) => (
                <li key={d.dia} className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
                  <span className="text-suave">
                    <span className="numeros text-apagado">{diaCurto(d.dia)}</span> · {d.estado === "tomou" ? "Tomei" : "Não tomei"}
                  </span>
                  <button
                    type="button"
                    aria-label={`Apagar registro de ${diaCurto(d.dia)}`}
                    onClick={() => acao(() => chamar(`/api/tratamentos/${t.id}/tomadas?dia=${d.dia}`, "DELETE"))}
                    className="text-[12.5px] text-perigo/80 active:text-perigo"
                  >
                    Apagar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {t.doses.length > 0 && (
          <div>
            <h3 className="text-[13px] font-medium text-tinta">Histórico de dose informada</h3>
            <ul className="mt-2 divide-y divide-borda">
              {t.doses.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
                  <span className="text-suave">
                    <span className="numeros text-apagado">{diaCurto(d.desdeDia)}</span> · {d.descricao}
                    {d.nota && <span className="block text-apagado">{d.nota}</span>}
                  </span>
                  <button
                    type="button"
                    aria-label={`Apagar dose de ${diaCurto(d.desdeDia)}`}
                    onClick={() => acao(() => chamar(`/api/tratamentos/doses/${d.id}`, "DELETE"))}
                    className="text-[12.5px] text-perigo/80 active:text-perigo"
                  >
                    Apagar
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-[12px] text-apagado">Trocar de dose acrescenta uma linha aqui; o tratamento não recomeça.</p>
          </div>
        )}

        {t.efeitos.length > 0 && (
          <div>
            <h3 className="text-[13px] font-medium text-tinta">O que você notou</h3>
            <ul className="mt-2 divide-y divide-borda">
              {t.efeitos.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 py-2 text-[13.5px]">
                  <span className="min-w-0 break-words text-suave">
                    <span className="numeros text-apagado">{diaCurto(e.dia)}</span> · {e.descricao}
                    {e.intensidade && ` (${INTENSIDADE[e.intensidade - 1]?.rotulo.toLowerCase()})`}
                  </span>
                  <button
                    type="button"
                    aria-label={`Apagar registro de ${diaCurto(e.dia)}`}
                    onClick={() => acao(() => chamar(`/api/tratamentos/efeitos/${e.id}`, "DELETE"))}
                    className="shrink-0 text-[12.5px] text-perigo/80 active:text-perigo"
                  >
                    Apagar
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-[12px] leading-relaxed text-apagado">
              Se algo piorar, ou surgir pensamento de se machucar, procure atendimento: SAMU 192, ou CVV 188 (24 h).
            </p>
          </div>
        )}
      </div>

      <details id={`consulta-${t.id}`} className="rounded-2xl border border-borda bg-white/[0.03] p-4">
        <summary className="cursor-pointer text-[14px] font-medium">Resumo para levar à consulta</summary>
        <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-suave">{t.resumoParaConsulta}</pre>
        <Botao
          type="button"
          variante="vazio"
          className="mt-3 !px-4 !py-2.5 text-[13.5px]"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(t.resumoParaConsulta);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            } catch {
              setErro("Não consegui copiar. Selecione o texto e copie.");
            }
          }}
        >
          {copiado ? "Copiado ✓" : "Copiar"}
        </Botao>
      </details>

      <div className="border-t border-borda pt-3">
        {apagar ? (
          <div className="space-y-2.5">
            <p className="text-[13px] leading-relaxed text-perigo">
              Apaga este acompanhamento com todas as tomadas, doses e anotações. Não dá para desfazer.
            </p>
            <div className="flex gap-2">
              <Botao variante="fantasma" className="flex-1" type="button" onClick={() => setApagar(false)}>
                Cancelar
              </Botao>
              <Botao variante="perigo" className="flex-1" type="button" carregando={ocupado} onClick={() => acao(() => chamar(`/api/tratamentos/${t.id}`, "DELETE"))}>
                Apagar tudo
              </Botao>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setApagar(true)} className="text-[13.5px] text-perigo/80 active:text-perigo">
            Apagar este acompanhamento e seus registros
          </button>
        )}
      </div>
    </section>
  );
}

function Outros({ lista }: { lista: TratamentoUI[] }) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  return (
    <div>
      <h3 className="text-[13px] font-medium text-tinta">Outros medicamentos que você registrou</h3>
      <p className="mt-1 text-[12.5px] leading-relaxed text-apagado">
        Estes não têm conteúdo no catálogo; o app só guarda o que você informa.
      </p>
      <ul className="mt-2 divide-y divide-borda">
        {lista.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px]">
            <span className="text-suave">
              {t.nome} <span className="text-apagado">· desde {diaCurto(t.inicio)}</span>
            </span>
            <button
              type="button"
              onClick={async () => {
                const r = await chamar(`/api/tratamentos/${t.id}`, "DELETE");
                if (r.ok) router.refresh();
                else setErro(r.erro);
              }}
              className="text-[12.5px] text-perigo/80 active:text-perigo"
            >
              Apagar
            </button>
          </li>
        ))}
      </ul>
      <Erro>{erro}</Erro>
    </div>
  );
}

/* -------------------------------- formulários ------------------------------ */

function CampoDia({ valor, aoMudar, min, max, rotulo }: { valor: string; aoMudar: (v: string) => void; min: string; max: string; rotulo: string }) {
  return (
    <label className="block">
      <span className="text-[13px] text-suave">{rotulo}</span>
      <input
        type="date"
        value={valor}
        min={min}
        max={max}
        onChange={(e) => aoMudar(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-borda bg-white/[0.04] px-3.5 py-3 text-[15px] text-tinta focus:border-brand/60 focus:outline-none"
      />
    </label>
  );
}

function Rodape({ aoFechar, salvar, ocupado }: { aoFechar: () => void; salvar: () => void; ocupado: boolean }) {
  return (
    <div className="flex gap-2">
      <Botao variante="fantasma" className="flex-1" type="button" onClick={aoFechar}>
        Cancelar
      </Botao>
      <Botao className="flex-1" type="button" carregando={ocupado} onClick={salvar}>
        Salvar
      </Botao>
    </div>
  );
}

function FormDia({ id, inicio, hoje, aoFechar }: { id: string; inicio: string; hoje: string; aoFechar: () => void }) {
  const router = useRouter();
  const [dia, setDia] = useState(hoje);
  const [estado, setEstado] = useState<"tomou" | "nao_tomou" | null>(null);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function salvar() {
    if (!estado) return setErro("Escolha “tomei” ou “não tomei”.");
    setOcupado(true);
    const r = await chamar(`/api/tratamentos/${id}/tomadas`, "POST", { dia, estado });
    setOcupado(false);
    if (!r.ok) return setErro(r.erro);
    router.refresh();
    aoFechar();
  }
  return (
    <div className="space-y-4 rounded-2xl border border-borda bg-white/[0.03] p-4">
      <p className="text-[13.5px] leading-relaxed text-suave">
        Esqueceu de registrar? Informe um dia que passou. Registrar o mesmo dia de novo atualiza, não duplica.
      </p>
      <CampoDia valor={dia} aoMudar={setDia} min={inicio} max={hoje} rotulo="Dia" />
      <Opcoes
        valor={estado}
        aoMudar={setEstado}
        rotulo="O que aconteceu"
        opcoes={[
          { id: "tomou", rotulo: "Tomei" },
          { id: "nao_tomou", rotulo: "Não tomei" },
        ]}
      />
      <Erro>{erro}</Erro>
      <Rodape aoFechar={aoFechar} salvar={salvar} ocupado={ocupado} />
    </div>
  );
}

function FormEfeito({ id, inicio, hoje, aoFechar }: { id: string; inicio: string; hoje: string; aoFechar: () => void }) {
  const router = useRouter();
  const [descricao, setDescricao] = useState("");
  const [intensidade, setIntensidade] = useState<"1" | "2" | "3" | null>(null);
  const [dia, setDia] = useState(hoje);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function salvar() {
    setOcupado(true);
    const r = await chamar(`/api/tratamentos/${id}/efeitos`, "POST", {
      dia,
      descricao,
      intensidade: intensidade ? Number(intensidade) : null,
    });
    setOcupado(false);
    if (!r.ok) return setErro(r.erro);
    router.refresh();
    aoFechar();
  }
  return (
    <div className="space-y-4 rounded-2xl border border-borda bg-white/[0.03] p-4">
      <p className="text-[13.5px] leading-relaxed text-suave">
        Anote o que você percebeu, do seu jeito. Isso fica para você e para levar à consulta; o app não diz o que causou.
      </p>
      <Texto valor={descricao} aoMudar={setDescricao} rotulo="O que você notou" max={300} placeholder="ex.: enjoo de manhã" />
      <Opcoes valor={intensidade} aoMudar={setIntensidade} rotulo="Intensidade (opcional)" opcoes={[...INTENSIDADE]} />
      <CampoDia valor={dia} aoMudar={setDia} min={inicio} max={hoje} rotulo="Dia" />
      <Erro>{erro}</Erro>
      <Rodape aoFechar={aoFechar} salvar={salvar} ocupado={ocupado} />
    </div>
  );
}

function FormDose({ id, inicio, hoje, aoFechar }: { id: string; inicio: string; hoje: string; aoFechar: () => void }) {
  const router = useRouter();
  const [descricao, setDescricao] = useState("");
  const [desde, setDesde] = useState(hoje);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function salvar() {
    setOcupado(true);
    const r = await chamar(`/api/tratamentos/${id}/doses`, "POST", { descricao, desde });
    setOcupado(false);
    if (!r.ok) return setErro(r.erro);
    router.refresh();
    aoFechar();
  }
  return (
    <div className="space-y-4 rounded-2xl border border-borda bg-white/[0.03] p-4">
      <p className="text-[13.5px] leading-relaxed text-suave">
        Informe a dose como está na sua prescrição. Quem define a dose é seu médico; o app só guarda o que você informa e
        não recomenda iniciar, aumentar, reduzir nem parar.
      </p>
      <Texto valor={descricao} aoMudar={setDescricao} rotulo="Dose" max={40} placeholder="ex.: 10 mg" />
      <CampoDia valor={desde} aoMudar={setDesde} min={inicio} max={hoje} rotulo="Desde quando" />
      <Erro>{erro}</Erro>
      <Rodape aoFechar={aoFechar} salvar={salvar} ocupado={ocupado} />
    </div>
  );
}
