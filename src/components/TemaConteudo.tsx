import type { ReactNode } from "react";
import { FONTES } from "@/lib/conhecimento/fontes";
import { fontesDoTema } from "@/lib/conhecimento/validacao";
import type { StatusEditorial, Tema } from "@/lib/conhecimento/tipos";

const STATUS: Record<StatusEditorial, { rotulo: string; aviso: string }> = {
  "fontes-conferidas": {
    rotulo: "Fontes conferidas",
    aviso: "Cada afirmação foi comparada com a fonte lida. Não houve revisão por profissional de saúde.",
  },
  parcial: {
    rotulo: "Revisão parcial",
    aviso: "Parte das fontes só foi vista em resumo ou não foi acessada. Não houve revisão por profissional de saúde.",
  },
  "revisado-por-profissional": {
    rotulo: "Revisado por profissional",
    aviso: "Conteúdo revisado por profissional de saúde.",
  },
};

const ROTULO_CATEGORIA: Record<Tema["categoria"], string> = {
  habito: "Hábito",
  medicamento: "Medicamento",
  rotina: "Rotina",
  "bem-estar": "Bem-estar",
};

function data(iso: string): string {
  const [a, m, d] = iso.split("-");
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

/** Números das fontes ao lado da frase: o texto fica curto, a origem fica a um toque. */
function Refs({ ids, numeros }: { ids?: string[]; numeros: Map<string, number> }) {
  const lista = (ids ?? []).map((i) => numeros.get(i)).filter((n): n is number => n !== undefined);
  if (lista.length === 0) return null;
  return (
    <sup className="ml-1 whitespace-nowrap text-[11px] text-apagado" aria-label={`Fontes ${lista.join(", ")}`}>
      [{lista.join(", ")}]
    </sup>
  );
}

function Bloco({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="cartao p-5">
      <h2 id={id} className="text-[12px] font-semibold tracking-[0.12em] text-apagado uppercase">
        {titulo}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Detalhes({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <details className="group border-t border-borda py-3 first:border-t-0 first:pt-0 last:pb-0">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-[14.5px] font-medium text-tinta [&::-webkit-details-marker]:hidden">
        <span>{titulo}</span>
        <span aria-hidden className="mt-0.5 text-apagado transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>
      <div className="mt-2 text-[14px] leading-relaxed text-suave">{children}</div>
    </details>
  );
}

/**
 * O conteúdo de um tema, na ordem pedida: Seu progresso, Benefícios possíveis, O que observar,
 * Próximo passo, Fontes. O que é curto fica à vista; o que é longo abre sob demanda.
 * `progresso` é o que a pessoa REGISTROU (outro tipo de informação, mostrado à parte).
 */
export function TemaConteudo({ tema, progresso }: { tema: Tema; progresso: ReactNode }) {
  const fontes = fontesDoTema(tema, FONTES);
  const numeros = new Map(fontes.map((f, i) => [f.id, i + 1]));
  const status = STATUS[tema.status];

  return (
    <div className="space-y-4">
      <header>
        <p className="text-[12px] font-semibold tracking-[0.12em] text-brand uppercase">{ROTULO_CATEGORIA[tema.categoria]}</p>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight">{tema.titulo}</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-suave">{tema.descricao}</p>
        <p
          className="mt-3 inline-block rounded-full border border-borda bg-white/[0.03] px-3 py-1 text-[12px] text-suave"
          title={status.aviso}
        >
          {status.rotulo} · revisado em {data(tema.revisadoEm)}
        </p>
      </header>

      <Bloco id="seu-progresso" titulo="Seu progresso">
        {progresso}
      </Bloco>

      <Bloco id="beneficios" titulo="Benefícios possíveis">
        <ul className="space-y-3">
          {tema.beneficios.map((b) => (
            <li key={b.id} className="text-[14px] leading-relaxed text-suave">
              {b.texto}
              <Refs ids={b.fontes} numeros={numeros} />
              {b.ressalva && <span className="mt-1 block text-[12.5px] text-apagado">{b.ressalva}</span>}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12.5px] leading-relaxed text-apagado">
          São possibilidades descritas nas fontes, não resultados garantidos para você.
        </p>
      </Bloco>

      <Bloco id="observar" titulo="O que observar">
        <ul className="list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-suave marker:text-apagado">
          {tema.oQueObservar.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        {tema.sinaisDeAjuda.length > 0 && (
          <div className="mt-4 rounded-2xl border border-borda bg-white/[0.03] p-4">
            <p className="text-[13px] font-medium text-tinta">Quando procurar ajuda</p>
            <ul className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-suave">
              {tema.sinaisDeAjuda.map((s) => (
                <li key={s.texto} className={s.nivel === "urgencia" ? "text-tinta" : ""}>
                  {s.nivel === "urgencia" && <span className="font-semibold text-perigo">Urgente: </span>}
                  {s.texto}
                  <Refs ids={s.fontes} numeros={numeros} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Bloco>

      <Bloco id="proximo-passo" titulo="Próximo passo">
        <p className="text-[13px] text-apagado">Sugestões práticas, não afirmações de saúde. Escolha o que couber na sua rotina.</p>
        <div className="mt-3">
          {tema.estrategias.slice(0, 3).map((e) => (
            <Detalhes key={e.id} titulo={e.titulo}>
              {e.texto}
              <Refs ids={e.fontes} numeros={numeros} />
            </Detalhes>
          ))}
        </div>
        {tema.estrategias.length > 3 && (
          <details className="mt-1">
            <summary className="cursor-pointer text-[13.5px] text-brand">Ver mais {tema.estrategias.length - 3} sugestões</summary>
            <div className="mt-2">
              {tema.estrategias.slice(3).map((e) => (
                <Detalhes key={e.id} titulo={e.titulo}>
                  {e.texto}
                  <Refs ids={e.fontes} numeros={numeros} />
                </Detalhes>
              ))}
            </div>
          </details>
        )}
      </Bloco>

      <Bloco id="perguntas" titulo="Perguntas frequentes">
        {tema.faq.map((f) => (
          <Detalhes key={f.id} titulo={f.pergunta}>
            {f.resposta}
            <Refs ids={f.fontes} numeros={numeros} />
          </Detalhes>
        ))}
      </Bloco>

      {tema.dificuldades.length > 0 && (
        <Bloco id="dificuldades" titulo="Dificuldades comuns">
          {tema.dificuldades.map((d) => (
            <Detalhes key={d.id} titulo={d.titulo}>
              {d.texto}
            </Detalhes>
          ))}
        </Bloco>
      )}

      {tema.marcos.length > 0 && (
      <Bloco id="marcos" titulo="Etapas da jornada">
        <p className="text-[13px] leading-relaxed text-apagado">
          Os números organizam a jornada; não são prazos de melhora. Você pode ler as etapas futuras, nada é trancado.
        </p>
        <div className="mt-3">
          {tema.marcos.map((m) => (
            <Detalhes key={m.chave} titulo={`${m.limiar} ${m.limiar === 1 ? "dia" : "dias"}`}>
              {m.texto}
            </Detalhes>
          ))}
        </div>
      </Bloco>
      )}

      <Bloco id="limites" titulo="O que este conteúdo não pode afirmar">
        <ul className="list-disc space-y-2 pl-5 text-[13.5px] leading-relaxed text-suave marker:text-apagado">
          {tema.limites.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Bloco>

      <Bloco id="fontes" titulo="Fontes">
        <ol className="space-y-3 text-[13.5px] leading-relaxed text-suave">
          {fontes.map((f, i) => (
            <li key={f.id} className="flex gap-2.5">
              <span className="numeros mt-0.5 w-5 shrink-0 text-apagado">[{i + 1}]</span>
              <span className="min-w-0">
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="break-words text-tinta underline decoration-white/20 underline-offset-2">
                  {f.titulo}
                </a>
                <span className="block text-[12.5px] text-apagado">
                  {f.orgao}
                  {f.pais ? ` · ${f.pais}` : ""} · conferida em {data(f.verificadoEm)}
                  {f.verificacao === "resumo de busca" ? " · só o resumo da busca foi lido" : ""}
                </span>
                {f.observacao && <span className="block text-[12.5px] text-apagado">{f.observacao}</span>}
              </span>
            </li>
          ))}
        </ol>
        {tema.notaEditorial && (
          <p className="mt-4 rounded-2xl border border-borda bg-white/[0.03] p-4 text-[12.5px] leading-relaxed text-suave">
            <strong className="text-tinta">Nota editorial.</strong> {tema.notaEditorial}
          </p>
        )}
        <p className="mt-3 text-[12px] leading-relaxed text-apagado">
          Este conteúdo é educativo. Não substitui avaliação, diagnóstico ou orientação de profissional de saúde.
        </p>
      </Bloco>
    </div>
  );
}
