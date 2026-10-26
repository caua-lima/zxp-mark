/**
 * Benefícios possíveis — conteúdo educativo, sempre com fonte e data.
 *
 * A tela de uma etapa separa três coisas que não podem se misturar:
 *
 *   1. CONQUISTA REGISTRADA  — baseada nos dados do app ("você chegou a 1 semana").
 *   2. BENEFÍCIO POSSÍVEL    — conteúdo educativo de fonte oficial. Descreve o que
 *                              a literatura aponta para quem para de fumar, NÃO o
 *                              que está acontecendo com esta pessoa. Sem garantia.
 *   3. MELHORA PERCEBIDA     — o que a própria pessoa escreveu. Mora no banco
 *                              (Percepcao) e nunca é inferida daqui.
 *
 * Regras deste arquivo:
 *   - Sem fonte verificada, não há benefício. O texto vira uma mensagem factual
 *     sobre o registro ou a rotina — nunca uma afirmação de saúde "por analogia".
 *   - Medicamento/tratamento nunca ganha benefício inventado a partir do nome ou
 *     dos dias decorridos. O contador só mede tempo.
 *   - Viagem e eventos (contagem regressiva) não têm benefício de saúde: o
 *     conteúdo deles é preparação e expectativa, e mora em mensagens.ts.
 *
 * Puro e sem alias.
 */
import type { Etapa, TipoProgresso } from "./progressao.ts";

export type Fonte = {
  id: string;
  titulo: string;
  orgao: string;
  url: string;
  /** data que a própria página exibe; null se ela não exibe nenhuma */
  dataDaPagina: string | null;
  /** quando alguém do projeto conferiu o conteúdo contra a fonte */
  verificadoEm: string;
  /** "pagina lida": o texto foi lido na fonte. "resumo de busca": só o resumo. */
  verificacao: "pagina lida" | "resumo de busca";
};

export const FONTES: Record<string, Fonte> = {
  cdc: {
    id: "cdc",
    titulo: "Benefits of Quitting",
    orgao: "CDC (EUA)",
    url: "https://www.cdc.gov/tobacco/about/benefits-of-quitting.html",
    dataDaPagina: "2024-05-15",
    verificadoEm: "2026-10-26",
    verificacao: "pagina lida",
  },
  nhs: {
    id: "nhs",
    titulo: "Benefits of quitting smoking",
    orgao: "NHS (Reino Unido)",
    url: "https://www.nhs.uk/better-health/quit-smoking/benefits-of-quitting-smoking/",
    dataDaPagina: null,
    verificadoEm: "2026-10-26",
    verificacao: "pagina lida",
  },
  lally: {
    id: "lally",
    titulo: "How are habits formed: Modelling habit formation in the real world",
    orgao: "Lally et al., European Journal of Social Psychology, 2010",
    url: "https://bps.org.uk/research-digest/how-form-habit",
    dataDaPagina: null,
    verificadoEm: "2026-10-26",
    verificacao: "resumo de busca",
  },
};

export type Beneficio = { texto: string; fonteId: string };

/**
 * Cigarro. Cada linha espelha uma linha da tabela de prazos da fonte, sempre
 * com verbo de possibilidade e "em comparação com continuar fumando".
 * A chave é a chave da etapa em habitos.ts.
 */
const CIGARRO: Record<string, Beneficio> = {
  "20min": {
    texto: "A frequência cardíaca começa a cair em minutos sem fumar.",
    fonteId: "cdc",
  },
  "1d": {
    texto: "O nível de nicotina no sangue cai a zero em cerca de 24 horas.",
    fonteId: "cdc",
  },
  "2d": {
    texto: "Nos primeiros dias ou semanas, o paladar e o olfato podem melhorar, e respirar pode ficar mais fácil.",
    fonteId: "nhs",
  },
  "3d": {
    texto: "Em alguns dias, o monóxido de carbono no sangue cai ao nível de quem não fuma.",
    fonteId: "cdc",
  },
  "30d": {
    texto: "Entre 1 e 12 meses sem fumar, a tosse e a falta de ar tendem a diminuir.",
    fonteId: "cdc",
  },
  "60d": {
    texto: "A partir de cerca de 6 semanas, algumas pessoas passam a notar benefícios para a saúde mental.",
    fonteId: "nhs",
  },
  "1a": {
    texto: "Entre 1 e 2 anos sem fumar, o risco de infarto cai de forma acentuada em comparação com continuar fumando.",
    fonteId: "cdc",
  },
  "5a": {
    texto: "Entre 5 e 10 anos sem fumar, o risco de AVC diminui em comparação com continuar fumando.",
    fonteId: "cdc",
  },
  "10a": {
    texto: "Após 10 a 15 anos sem fumar, o risco adicional de câncer de pulmão cai pela metade em comparação com continuar fumando.",
    fonteId: "cdc",
  },
  "15a": {
    texto: "Após 15 anos sem fumar, o risco de doença coronariana fica próximo ao de quem nunca fumou.",
    fonteId: "cdc",
  },
};

/** Vale para qualquer hábito: não é efeito de saúde, é sobre como hábitos se formam. */
const GERAIS: Record<string, Beneficio> = {
  "21d": {
    texto:
      "Não existe um número mágico: num estudo com 96 pessoas, o tempo para um comportamento ficar automático variou de 18 a 254 dias, com mediana de 66.",
    fonteId: "lally",
  },
};

const POR_PRESET: Record<string, Record<string, Beneficio>> = { cigarro: CIGARRO };

export function beneficioDe(presetId: string, chave: string): { texto: string; fonte: Fonte } | null {
  const b = POR_PRESET[presetId]?.[chave] ?? GERAIS[chave];
  if (!b) return null;
  const fonte = FONTES[b.fonteId];
  return fonte ? { texto: b.texto, fonte } : null;
}

/** Todas as chaves de etapa que têm benefício para um preset (usado nos testes). */
export function chavesComBeneficio(presetId: string): string[] {
  return [...Object.keys(POR_PRESET[presetId] ?? {}), ...Object.keys(GERAIS)];
}

export const TODOS_OS_BENEFICIOS: Record<string, Record<string, Beneficio>> = {
  ...POR_PRESET,
  geral: GERAIS,
};

export const AVISO_BENEFICIO =
  "Informação geral, sem garantia individual: o ritmo é diferente para cada pessoa, e isto não substitui a orientação de um profissional de saúde.";

/* --------------------------- conteúdo de uma etapa ------------------------ */

export type ContextoEtapa = {
  tipo: TipoProgresso;
  /** hábito: id do preset. Acompanhamento: a categoria. */
  presetId?: string;
  categoria?: string;
  etapa: Etapa;
  proxima: Etapa | null;
  /** quantas noites registradas (só para sono) */
  noites?: number;
};

export type ConteudoEtapa = {
  /** 1. baseado nos dados do app */
  conquista: string;
  /** 2. educativo; "fonte" tem referência, "factual" é só sobre o registro */
  beneficio:
    | { tipo: "fonte"; texto: string; fonte: Fonte; aviso: string }
    | { tipo: "factual"; texto: string };
  /** o que vem depois; sempre uma frase, nunca uma cobrança */
  proximoPasso: string;
};

function conquistaDe(c: ContextoEtapa): string {
  const { etapa } = c;
  if (etapa.inicial) {
    if (c.tipo === "sono") return "Você começou a registrar o seu sono.";
    if (c.tipo === "acompanhamento") return "Você registrou o início. O contador está rodando.";
    return "Você começou. O relógio está rodando.";
  }
  if (c.tipo === "sono") {
    return etapa.limiar === 1
      ? "Você registrou a sua primeira noite."
      : `Você já registrou ${etapa.limiar} noites.`;
  }
  if (c.tipo === "acompanhamento") {
    return `Já se passou ${etapa.titulo.toLowerCase()} desde o início.`;
  }
  return `Você chegou a “${etapa.titulo}”.`;
}

function factualDe(c: ContextoEtapa): string {
  if (c.tipo === "sono") {
    if (c.etapa.limiar >= 7) {
      return "Com uma semana de registros já dá para ver o seu padrão: em quais dias você dormiu mais e em quais menos. Sem metas — o objetivo é só observar.";
    }
    return "Cada registro ajuda a enxergar o seu padrão ao longo do tempo. Não há meta de horas.";
  }
  if (c.tipo === "acompanhamento") {
    // Tratamento: o contador mede tempo, e só. Nada de adesão, dose ou resultado.
    if (c.categoria === "tratamento") {
      return "Este contador mostra só o tempo desde o início — não indica doses tomadas nem resultado. Para isso, o melhor é conversar com quem acompanha o seu tratamento.";
    }
    return "Acompanhar o tempo ajuda a enxergar o caminho já percorrido.";
  }
  return "Sem promessas: o que esta etapa mostra é constância, registrada por você.";
}

/**
 * Monta as camadas de uma etapa. O benefício de saúde só aparece para hábito
 * (marco) com fonte; todo o resto cai numa mensagem factual sobre o registro.
 */
export function conteudoDaEtapa(c: ContextoEtapa): ConteudoEtapa {
  // Só hábito (marco) tem benefício de saúde, e só com fonte. Contagem
  // crescente e sono caem sempre na mensagem factual abaixo.
  const achado =
    c.tipo === "marco" && c.presetId && !c.etapa.inicial ? beneficioDe(c.presetId, c.etapa.chave) : null;

  const beneficio: ConteudoEtapa["beneficio"] = achado
    ? { tipo: "fonte", texto: achado.texto, fonte: achado.fonte, aviso: AVISO_BENEFICIO }
    : { tipo: "factual", texto: factualDe(c) };

  const proximoPasso = c.proxima
    ? c.tipo === "acompanhamento"
      ? `Próxima etapa: ${c.proxima.titulo} desde o início.`
      : `Próxima etapa: ${c.proxima.titulo}.`
    : "Você chegou ao fim da trilha. O registro continua valendo.";

  return { conquista: conquistaDe(c), beneficio, proximoPasso };
}
