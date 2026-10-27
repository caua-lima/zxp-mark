/**
 * O assistente, do lado do conhecimento.
 *
 * Um módulo só, sem rede e sem alias, que serve a DOIS caminhos para que ambos
 * obedeçam às mesmas regras:
 *   1. `responderComConhecimento` — a resposta local, montada daqui mesmo;
 *   2. `secaoParaModelo` — o trecho que entra no prompt quando há um provedor de IA.
 *
 * Regras (as mesmas nos dois caminhos; testadas):
 *   - só conhecimento RELEVANTE à pergunta (`selecionar`), nunca o tema inteiro;
 *   - só os registros NECESSÁRIOS, e só se a pessoa ligou "usar meus registros de saúde";
 *   - toda afirmação de saúde vem com a fonte, e a fonte é citada;
 *   - dado que falta é dito que falta; nada é completado por palpite;
 *   - observação ≠ causa: nunca "o remédio melhorou o seu sono";
 *   - sem resposta fundamentada, o app admite o limite.
 */
import { FONTES } from "./fontes.ts";
import { TEMAS } from "./catalogo.ts";
import { normalizar, reconhecer, selecionar } from "./indice.ts";
import type { Faq, Tema } from "./tipos.ts";

export type ContagemDias = { completos: number; diaN: number };

export type DadosTratamento = {
  nome: string;
  medicamentoId: string;
  desdeInicio: ContagemDias;
  dose: { descricao: string; contagem: ContagemDias } | null;
  sequencia: number;
  totalRegistrados: number;
  diasSemInformacao: number;
  efeitos: { dia: string; descricao: string }[];
};

export type DadosUnhas = {
  totalEpisodios: number;
  totalDiasConfirmados: number;
  sequencia: number;
  diasDesdeReferencia: number;
  referencia: "episodio" | "inicio";
  diasSemInformacao: number;
};

export type DadosSaude = {
  /** a pessoa ligou "o assistente usa os meus registros de saúde" */
  autorizado: boolean;
  tratamento?: DadosTratamento | null;
  unhas?: DadosUnhas | null;
  /** frases descritivas já prontas (humor.ts), ou null se não há base */
  comparacaoSono?: string | null;
  cruzamentoHumorSono?: string | null;
};

export type RespostaConhecimento = {
  texto: string;
  temaId: string | null;
  /** ids de fontes citadas */
  fontes: string[];
  /** a resposta usou registros pessoais */
  usouRegistros: boolean;
};

const PEDIR_PERMISSAO =
  "Se você quiser que eu use os seus registros para responder, ligue “Assistente e saúde” no Perfil. Por padrão eu não leio nada disso.";

/* ------------------------------ fontes -------------------------------------- */

export function linhaDeFontes(ids: string[]): string {
  const unicos = [...new Set(ids)].filter((id) => FONTES[id]);
  if (unicos.length === 0) return "";
  const itens = unicos.map((id) => {
    const f = FONTES[id];
    const data = f.dataDaPagina ? `, ${f.dataDaPagina.split("-").reverse().join("/")}` : "";
    return `${f.orgao}${data}`;
  });
  return `Fontes: ${itens.join("; ")}.`;
}

/* --------------------------- frases com os registros ------------------------ */

const dias = (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`;

function registrosDoTratamento(t: DadosTratamento): string {
  const partes = [
    `o tratamento (${t.nome}) começou há ${dias(t.desdeInicio.completos)} completos`,
    t.dose
      ? `a dose informada atual é ${t.dose.descricao}, há ${dias(t.dose.contagem.completos)} completos`
      : "você não informou dose",
    `${dias(t.sequencia)} consecutivos com tomada registrada`,
    `${dias(t.totalRegistrados)} registrados no total`,
    `${dias(t.diasSemInformacao)} sem nenhuma informação`,
  ];
  return `Pelos seus registros: ${partes.join("; ")}.`;
}

function registrosDeUnhas(u: DadosUnhas): string {
  const ref =
    u.referencia === "episodio"
      ? `${dias(u.diasDesdeReferencia)} desde o último episódio informado`
      : `${dias(u.diasDesdeReferencia)} desde o início do acompanhamento, sem episódio informado`;
  return `Pelos seus registros: ${ref}; ${dias(u.sequencia)} seguidos com “hoje não roí” confirmado; ${dias(u.totalDiasConfirmados)} confirmados no total; ${u.totalEpisodios} ${u.totalEpisodios === 1 ? "episódio" : "episódios"} registrado${u.totalEpisodios === 1 ? "" : "s"}; ${dias(u.diasSemInformacao)} sem informação.`;
}

/* ------------------------------ reconhecer o tema -------------------------- */

const SOBRE_TRATAMENTO =
  /\b(dose|mg|esqueci de registrar|esqueci de tomar|sequencia|piorei|pior desde|desde que comecei|efeito colateral|efeitos|remedio|medicamento|tomada|tomando)\b/;
const SOBRE_UNHAS = /\b(unha|unhas|roi|roer|roendo|onicofagia)\b/;
const SOBRE_SONO_HUMOR = /\b(sono|dormi|dormir|humor|energia)\b/;
const PEDE_RELACAO = /\b(relacao|relaciona|relacionar|junto|influ\w*|por causa|melhorou|piorou|ligado|tem a ver|cruz\w*)\b/;

function escolherTema(pergunta: string, dados: DadosSaude): { tema: Tema | null; aviso?: string } {
  const r = reconhecer(pergunta, TEMAS);
  if (r?.tipo === "exato") return { tema: r.tema };
  if (r?.tipo === "incerto") {
    return { tema: null, aviso: `Você quis dizer “${r.tema.titulo}”? Se for, me diga de novo com esse nome, e eu respondo com o que o app tem sobre ele.` };
  }
  if (r?.tipo === "outro-medicamento") {
    return { tema: null, aviso: `${r.digitado[0].toUpperCase()}${r.digitado.slice(1)} não é o mesmo medicamento que ${r.naoE}, e o app só tem conteúdo verificado sobre o ${r.naoE}. Para dúvidas sobre ${r.digitado}, o melhor é a bula do seu medicamento e o profissional que o prescreveu.` };
  }
  const t = normalizar(pergunta);
  // Pergunta sem o nome do medicamento, mas a pessoa acompanha um tratamento do catálogo.
  if (dados.autorizado && dados.tratamento && SOBRE_TRATAMENTO.test(t)) {
    const tema = TEMAS.find((x) => x.id === dados.tratamento?.medicamentoId);
    if (tema) return { tema };
  }
  if (dados.autorizado && dados.unhas && /\b(perdi|progresso|recaida|de novo)\b/.test(t) && SOBRE_UNHAS.test(t)) {
    return { tema: TEMAS.find((x) => x.id === "unhas") ?? null };
  }
  return { tema: null };
}

/**
 * Perguntas sobre medicamento que NÃO dizem qual é, quando o app também não pode (ou
 * não sabe) olhar os registros. A resposta é geral e correta; a de piora é de
 * segurança e portanto NUNCA depende de a pessoa ter permitido o uso dos registros.
 */
function respostaGeral(t: string): RespostaConhecimento | null {
  if (/\b(estou pior|piorei|me sinto pior|pior desde)\b/.test(t) && /\b(comecei|remedio|medicamento|tratamento|tomar|tomando|dose)\b/.test(t)) {
    return {
      texto:
        "Obrigado por contar. Sentir-se pior depois de começar ou de mudar um medicamento deve ser dito ao médico ou ao farmacêutico logo; não espere melhorar sozinho. O app não consegue saber se é o medicamento, a condição ou outra coisa. Se houver pensamentos de se machucar ou de acabar com a vida, procure atendimento hospitalar imediatamente, ligue 192 (SAMU) ou 188 (CVV, 24 horas, gratuito).",
      temaId: null,
      fontes: ["cvv"],
      usouRegistros: false,
    };
  }
  if (/\b(mudei a dose|mudaram a dose|aumentei a dose|diminui a dose|dose nova|troquei a dose)\b/.test(t)) {
    return {
      texto:
        "Mudanças de dose são decisão de quem prescreve. No app, informar uma dose nova só acrescenta uma linha ao histórico: o início do tratamento, as tomadas e a sequência não mudam, e o app não calcula nenhuma previsão nova. Se você me disser qual é o medicamento (ou ligar “Assistente e saúde” no Perfil), eu respondo com o que a bula diz.",
      temaId: null,
      fontes: [],
      usouRegistros: false,
    };
  }
  if (/\b(esqueci de registrar|nao registrei|perdi (a |minha )?sequencia)\b/.test(t)) {
    const faq = TEMAS.find((x) => x.id === "escitalopram")?.faq.find((f) => f.id === "esqueci-de-registrar");
    if (faq) return { texto: `${faq.resposta}\n\n${PEDIR_PERMISSAO}`, temaId: null, fontes: [], usouRegistros: false };
  }
  return null;
}

/* ---------------------------- a resposta local ----------------------------- */

const ABERTURAS_NEUTRAS = ["Vamos olhar o que eu sei e o que os seus registros mostram.", "Respondo com o que está verificado e com o que você registrou.", "Aqui vai o que eu tenho de confiável sobre isso."];
const escolher = <T,>(l: T[], semente: number) => l[Math.abs(semente) % l.length];

/**
 * Devolve uma resposta fundamentada, ou null quando a pergunta não é do conhecimento
 * do catálogo (aí quem responde é o motor de hábitos de sempre).
 */
export function responderComConhecimento(
  pergunta: string,
  dados: DadosSaude,
  ops: { turno?: number } = {}
): RespostaConhecimento | null {
  const semente = ops.turno ?? 0;
  const t = normalizar(pergunta);

  /* --- sono e humor: observar, nunca concluir causa --- */
  if (SOBRE_SONO_HUMOR.test(t) && PEDE_RELACAO.test(t) && !reconhecer(pergunta, TEMAS)) {
    if (!dados.autorizado) {
      return { texto: `Eu consigo mostrar o que aparece nos seus registros de sono e de humor lado a lado. ${PEDIR_PERMISSAO}`, temaId: null, fontes: [], usouRegistros: false };
    }
    const partes = [dados.comparacaoSono, dados.cruzamentoHumorSono].filter(Boolean) as string[];
    const corpo = partes.length
      ? partes.join(" ")
      : "Você ainda não registrou sono e humor o bastante, nos mesmos dias, para eu comparar alguma coisa.";
    return {
      texto: `${corpo} Duas coisas que andam juntas nos números não mostram que uma causa a outra; quem consegue avaliar isso com você é o profissional.`,
      temaId: null,
      fontes: [],
      usouRegistros: partes.length > 0,
    };
  }

  const { tema, aviso } = escolherTema(pergunta, dados);
  if (aviso) return { texto: aviso, temaId: null, fontes: [], usouRegistros: false };
  if (!tema) return respostaGeral(t);

  const sel = selecionar(tema, pergunta, 2);
  const faq: Faq | undefined = sel.faq[0];
  const fontes: string[] = [];
  const blocos: string[] = [];
  let usouRegistros = false;

  /* --- alerta: o conteúdo de procurar ajuda vem ANTES de qualquer outra coisa ---
     (se a própria resposta já traz os números de urgência, eles não se repetem) */
  const respostaJaTrazUrgencia = !!faq && /\b192\b/.test(faq.resposta);
  if (sel.alerta && sel.sinais.length && !respostaJaTrazUrgencia) {
    const urgentes = sel.sinais.filter((s) => s.nivel === "urgencia");
    const resto = sel.sinais.filter((s) => s.nivel !== "urgencia");
    const ordem = [...urgentes.slice(0, 1), ...resto.slice(0, 1)];
    blocos.push(ordem.map((s) => s.texto).join("\n\n"));
    for (const s of ordem) fontes.push(...(s.fontes ?? []));
  }

  if (faq) {
    blocos.push(faq.resposta);
    fontes.push(...(faq.fontes ?? []));
  } else if (sel.estrategias.length) {
    blocos.push(sel.estrategias.map((e) => `${e.titulo}: ${e.texto}`).join("\n\n"));
    for (const e of sel.estrategias) fontes.push(...(e.fontes ?? []));
  } else if (sel.beneficios.length) {
    blocos.push(sel.beneficios.map((b) => b.texto).join(" "));
    for (const b of sel.beneficios) fontes.push(...b.fontes);
  } else if (!sel.alerta) {
    const consulta = tema.categoria === "medicamento" ? " Para isso, a bula do seu medicamento e o profissional que o prescreveu são a referência." : "";
    return {
      texto: `Não tenho informação verificada sobre isso no que o app tem sobre ${tema.titulo.toLowerCase()}, e prefiro não completar com palpite.${consulta}`,
      temaId: tema.id,
      fontes: [],
      usouRegistros: false,
    };
  }

  /* --- registros pessoais: só se a pessoa permitiu, e só os deste tema --- */
  const personalizado = !sel.alerta || faq;
  if (personalizado) {
    if (!dados.autorizado) {
      if (faq && /\b(meu|minha|meus|minhas|registr|sequencia|dose|estou|ha \d+ dias|desde)\b/.test(t)) {
        blocos.push(PEDIR_PERMISSAO);
      }
    } else if (tema.rastreio.tipo === "medicamento") {
      if (dados.tratamento && dados.tratamento.medicamentoId === tema.id) {
        blocos.push(registrosDoTratamento(dados.tratamento));
        usouRegistros = true;
        if (faq?.id === "dez-dias-o-que-melhorou" || faq?.id === "pior-desde-que-comecei") {
          const ef = dados.tratamento.efeitos.slice(0, 3);
          if (ef.length) blocos.push(`Efeitos que você anotou: ${ef.map((e) => `${e.descricao} (${e.dia.split("-").reverse().join("/")})`).join("; ")}.`);
          if (dados.comparacaoSono) blocos.push(`${dados.comparacaoSono} Isso descreve os seus registros; não mostra a causa.`);
          if (dados.cruzamentoHumorSono && faq?.id === "dez-dias-o-que-melhorou") blocos.push(dados.cruzamentoHumorSono);
        }
      } else if (SOBRE_TRATAMENTO.test(t)) {
        blocos.push(`Você ainda não registrou nenhum acompanhamento de ${tema.titulo} no app, então eu não tenho números seus para citar. Se quiser, comece o registro na aba Marcos → Temas.`);
      }
    } else if (tema.rastreio.tipo === "episodios") {
      if (dados.unhas) {
        blocos.push(registrosDeUnhas(dados.unhas));
        usouRegistros = true;
      } else if (/\b(meu|minha|estou|roi|perdi|progresso)\b/.test(t)) {
        blocos.push("Você ainda não começou o acompanhamento de unhas no app, então eu não tenho números seus. Dá para começar em Marcos → Temas.");
      }
    }
  }

  // Só a resposta montada de estratégias/benefícios ganha uma abertura (e ela varia
  // com o turno); FAQ e alerta falam por si.
  const abertura = !sel.alerta && !faq ? `${escolher(ABERTURAS_NEUTRAS, semente)}\n\n` : "";
  const citacao = linhaDeFontes(fontes);
  const texto = `${abertura}${blocos.join("\n\n")}${citacao ? `\n\n${citacao}` : ""}`.trim();
  return { texto, temaId: tema.id, fontes: [...new Set(fontes)], usouRegistros };
}

/* --------------------------- o trecho para o modelo ------------------------- */

/** Regras que valem para o modelo, juntas e curtas. Entram no prompt SEMPRE. */
export const REGRAS_DE_SAUDE = `CONTEÚDO DE SAÚDE (vale para qualquer tema)
- Afirmação sobre saúde, medicamento ou corpo só com base no bloco "CONHECIMENTO VERIFICADO" deste contexto, e CITE a fonte (órgão e data) ao lado da afirmação. Se o bloco não cobre a pergunta, diga que não tem informação verificada e encaminhe para a bula e o profissional. Nunca complete com palpite.
- Distinga sempre: o que é informação educativa (com fonte), o que a pessoa registrou, o que o app calculou desses registros e o que a pessoa disse sentir. Não apresente inferência como fato sobre o corpo dela.
- Observação não é causa. Pode dizer "você registrou melhor qualidade de sono nesta semana". NUNCA diga "o medicamento melhorou o seu sono" ou "parar de roer unha melhorou o seu humor" a partir de coincidência no tempo.
- Medicamento: não recomende começar, aumentar, reduzir, suspender nem compensar dose; não estime quando o efeito vai começar nem diga que a pessoa "já deveria estar melhor". Dúvida sobre esquecimento de dose: cite a bula e encaminhe ao farmacêutico ou médico. A dose que a pessoa informou é um dado dela, não uma recomendação. Nunca confunda escitalopram com citalopram.
- Registros: a falta de registro NÃO prova que algo não aconteceu. Dia sem informação não é "não tomou" nem "não roeu". A sequência de dias é só organização do registro: não ameace a pessoa com "perder a sequência".
- Não diagnostique ninguém por causa de um hábito ou de um registro. Piora do humor, pensamentos de se machucar ou sinais graves recebem orientação de procurar ajuda (SAMU 192, CVV 188), não celebração nem incentivo automático a continuar.
- Use só os números do bloco "REGISTROS DA PESSOA". Se ele não existe, a pessoa não permitiu que você leia os registros: diga isso e explique que ela pode ligar "Assistente e saúde" no Perfil.`;

/**
 * O que entra no prompt ALÉM das regras: só o conhecimento da pergunta e só os
 * registros necessários. Sem tema reconhecido, devolve apenas as regras (nada de
 * saúde é enviado ao modelo).
 */
export function secaoParaModelo(pergunta: string, dados: DadosSaude): string {
  const { tema } = escolherTema(pergunta, dados);
  const partes: string[] = [REGRAS_DE_SAUDE];
  if (!tema) return partes.join("\n\n");

  const sel = selecionar(tema, pergunta, 3);
  const itens: string[] = [];
  const fontes: string[] = [];
  for (const f of sel.faq) {
    itens.push(`- P: ${f.pergunta}\n  R: ${f.resposta}`);
    fontes.push(...(f.fontes ?? []));
  }
  for (const b of sel.beneficios) {
    itens.push(`- ${b.texto}`);
    fontes.push(...b.fontes);
  }
  for (const e of sel.estrategias) {
    itens.push(`- (sugestão prática) ${e.titulo}: ${e.texto}`);
    fontes.push(...(e.fontes ?? []));
  }
  if (sel.alerta) for (const s of sel.sinais) itens.push(`- (SINAL DE AJUDA) ${s.texto}`);

  partes.push(
    `CONHECIMENTO VERIFICADO — ${tema.titulo} (status editorial: ${tema.status}, revisado em ${tema.revisadoEm})\n${itens.join("\n") || "- (nada específico para esta pergunta)"}\n${linhaDeFontes(fontes)}\nLimites do app neste tema:\n${tema.limites.map((l) => `- ${l}`).join("\n")}`
  );

  if (dados.autorizado) {
    const reg: string[] = [];
    if (dados.tratamento && dados.tratamento.medicamentoId === tema.id) reg.push(registrosDoTratamento(dados.tratamento));
    if (dados.unhas && tema.id === "unhas") reg.push(registrosDeUnhas(dados.unhas));
    if (dados.comparacaoSono) reg.push(dados.comparacaoSono);
    if (dados.cruzamentoHumorSono) reg.push(dados.cruzamentoHumorSono);
    if (reg.length) partes.push(`REGISTROS DA PESSOA (ela permitiu o uso; só o que serve a esta pergunta)\n${reg.join("\n")}`);
  } else {
    partes.push("REGISTROS DA PESSOA: não disponíveis (ela não ligou “Assistente e saúde”). Não cite números dela.");
  }
  return partes.join("\n\n");
}

