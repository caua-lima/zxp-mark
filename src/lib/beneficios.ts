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

// O registro de fontes é único e mora em conhecimento/fontes.ts; reexportado aqui
// para não quebrar quem já importa de beneficios.
import { FONTES } from "./conhecimento/fontes.ts";
import { unhas as temaUnhas } from "./conhecimento/temas/unhas.ts";
import type { Fonte } from "./conhecimento/tipos.ts";
export { FONTES };
export type { Fonte };

export type Beneficio = {
  texto: string;
  fonteId: string;
  /** o que a fonte NÃO diz sobre isto, ou um cuidado; mostrado junto */
  ressalva?: string;
  /**
   * true = não é um ganho, é o que COSTUMA ACONTECER nesta fase segundo a fonte (ex.: abstinência).
   * A tela troca o rótulo para "O que costuma acontecer nesta fase".
   */
  fase?: boolean;
};

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

/**
 * Roer unhas. Os benefícios vêm do tema do catálogo (uma só fonte de verdade: AAD e TLC Foundation),
 * ligados a algumas etapas. Nenhum deles afirma recuperação das unhas ou da pele: a ressalva do tema,
 * que diz que nenhuma fonte informa esse prazo, viaja junto e aparece na tela. As etapas que não têm
 * benefício aqui (3 dias e as de meses) ficam com a mensagem factual sobre o registro.
 */
const BENEFICIO_DE_UNHAS_POR_ETAPA: Record<string, string> = {
  "1d": "contaminacao",
  "7d": "infeccao-local",
  "10d": "pele-e-unha",
  "14d": "reversao-de-habito",
  "30d": "crescimento",
  "90d": "dentes",
  "180d": "autoestima",
};
const UNHAS: Record<string, Beneficio> = {
  ...Object.fromEntries(
    Object.entries(BENEFICIO_DE_UNHAS_POR_ETAPA).map(([chave, id]) => {
      const b = temaUnhas.beneficios.find((x) => x.id === id);
      if (!b) throw new Error(`tema unhas: benefício "${id}" não existe`);
      return [chave, { texto: b.texto, fonteId: b.fontes[0], ressalva: b.ressalva }];
    })
  ),
  // Conta direta sobre a média do estudo (3,47 mm/mês), sem prometer nada sobre a pele.
  "60d": {
    texto: "Na média de um estudo com adultos jovens saudáveis, a unha da mão cresce cerca de 3,5 mm por mês: em dois meses, perto de 7 mm.",
    fonteId: "bionumbers-unhas",
    ressalva: "É uma média; o ritmo varia com a idade, o dedo e a pessoa. Não é um prazo para a unha voltar ao aspecto de antes.",
  },
};

/**
 * Vape. O vape também tem nicotina: o CDC descreve, para quem para de vapear, a mesma abstinência
 * temporária. Os prazos vêm da página do NHS sobre abstinência de nicotina (escrita para quem para de
 * fumar), e o texto diz isso.
 */
const VAPE: Record<string, Beneficio> = {
  "6h": {
    texto: "Segundo o NHS, a abstinência de nicotina pode começar poucas horas depois do último uso: vontade forte, inquietação, irritação, dificuldade para dormir e para se concentrar.",
    fonteId: "nhs-abstinencia-nicotina",
    ressalva: "A página do NHS fala de cigarro; o vape também tem nicotina, e o CDC descreve os mesmos sintomas para quem para de vapear.",
    fase: true,
  },
  "3d": {
    texto: "Segundo o NHS, os sintomas de abstinência de nicotina costumam ser mais fortes na primeira semana, principalmente nos 3 primeiros dias.",
    fonteId: "nhs-abstinencia-nicotina",
    fase: true,
  },
  "7d": {
    texto: "Segundo o CDC, os sintomas de abstinência de quem para de vapear (irritação, inquietação, tristeza, sono ruim, fome, vontade de nicotina) são temporários e diminuem com o tempo sem nicotina.",
    fonteId: "cdc-vape",
    fase: true,
  },
  "30d": {
    texto: "Segundo o NHS, em média os sintomas de abstinência de nicotina duram de 3 a 4 semanas; algumas pessoas sentem por mais tempo, às vezes alguns meses.",
    fonteId: "nhs-abstinencia-nicotina",
    fase: true,
  },
};

/** Álcool. Abstinência pode ser grave: o aviso de emergência viaja com cada etapa das primeiras horas e dias. */
const EMERGENCIA_ALCOOL =
  "Abstinência de álcool pode ser grave. Convulsão, febre, confusão intensa, alucinações ou batimento irregular: emergência agora (SAMU 192). Quem bebia muito e todo dia deve parar com orientação médica.";
const ALCOOL: Record<string, Beneficio> = {
  "6h": {
    texto: "Segundo o MedlinePlus, os sintomas de abstinência de álcool costumam aparecer em até 8 horas depois da última dose, mas podem surgir dias depois: ansiedade, irritação, tremor, suor, dor de cabeça, insônia e náusea estão entre eles.",
    fonteId: "medlineplus-abstinencia-alcool",
    ressalva: EMERGENCIA_ALCOOL,
    fase: true,
  },
  "1d": {
    texto: "Segundo o MedlinePlus, os sintomas de abstinência de álcool costumam atingir o pico entre 24 e 72 horas.",
    fonteId: "medlineplus-abstinencia-alcool",
    ressalva: EMERGENCIA_ALCOOL,
    fase: true,
  },
  "3d": {
    texto: "Segundo o MedlinePlus, depois do pico (24 a 72 horas) os sintomas podem continuar por semanas.",
    fonteId: "medlineplus-abstinencia-alcool",
    ressalva: EMERGENCIA_ALCOOL,
    fase: true,
  },
  "7d": {
    texto: "Segundo o NHS, entre os efeitos imediatos de reduzir o álcool estão acordar melhor, ficar menos cansado durante o dia, ter mais energia e uma pele com melhor aspecto.",
    fonteId: "nhs-reduzir-alcool",
  },
  "30d": {
    texto: "Segundo o NHS, reduzir o álcool pode melhorar o humor em geral e ajudar a acordar mais descansado.",
    fonteId: "nhs-reduzir-alcool",
  },
  "90d": {
    texto: "Segundo o MedlinePlus, alterações de sono, mudanças rápidas de humor e cansaço podem durar meses depois de parar. Se isso acontecer, não quer dizer que algo deu errado.",
    fonteId: "medlineplus-abstinencia-alcool",
    fase: true,
  },
  "1a": {
    texto: "Segundo o NHS, reduzir o álcool ajuda a diminuir o risco de problemas ligados ao excesso de bebida, como câncer, diabetes, demência, AVC e doenças do coração, do fígado e dos rins.",
    fonteId: "nhs-reduzir-alcool",
    ressalva: "A fonte não diz em quanto tempo o risco cai; o marco de 1 ano não é um prazo.",
  },
};

/** Cafeína. O MedlinePlus descreve a abstinência e diz que ela costuma passar em alguns dias. */
const CAFEINA: Record<string, Beneficio> = {
  "12h": {
    texto: "Segundo o MedlinePlus, parar de repente o consumo regular de cafeína pode causar dor de cabeça, sonolência, irritação, náusea e dificuldade de concentração.",
    fonteId: "medlineplus-cafeina",
    fase: true,
  },
  "2d": {
    texto: "Segundo o MedlinePlus, esses sintomas de abstinência de cafeína costumam passar em alguns dias.",
    fonteId: "medlineplus-cafeina",
    fase: true,
  },
  "7d": {
    texto: "Segundo o MedlinePlus, cafeína em excesso pode causar inquietação, tremor, insônia, dor de cabeça, tontura, batimento acelerado e ansiedade. Repare se algo disso mudou para você.",
    fonteId: "medlineplus-cafeina",
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

const POR_PRESET: Record<string, Record<string, Beneficio>> = {
  cigarro: CIGARRO,
  unhas: UNHAS,
  vape: VAPE,
  alcool: ALCOOL,
  cafeina: CAFEINA,
};

export function beneficioDe(
  presetId: string,
  chave: string
): { texto: string; fonte: Fonte; ressalva?: string; fase?: boolean } | null {
  const b = POR_PRESET[presetId]?.[chave] ?? GERAIS[chave];
  if (!b) return null;
  const fonte = FONTES[b.fonteId];
  return fonte ? { texto: b.texto, fonte, ressalva: b.ressalva, fase: b.fase } : null;
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

/** O título do bloco depende do conteúdo: só o que tem fonte pode se chamar benefício. */
export function rotuloDoBeneficio(tipo: "fonte" | "factual", fase = false): string {
  if (tipo === "fonte") return fase ? "O que costuma acontecer nesta fase" : "Benefício possível";
  return "O que esta etapa mostra";
}

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
    | { tipo: "fonte"; texto: string; fonte: Fonte; aviso: string; ressalva?: string; fase?: boolean }
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
    ? { tipo: "fonte", texto: achado.texto, fonte: achado.fonte, aviso: AVISO_BENEFICIO, ressalva: achado.ressalva, fase: achado.fase }
    : { tipo: "factual", texto: factualDe(c) };

  const proximoPasso = c.proxima
    ? c.tipo === "acompanhamento"
      ? `Próxima etapa: ${c.proxima.titulo} desde o início.`
      : `Próxima etapa: ${c.proxima.titulo}.`
    : "Você chegou ao fim da trilha. O registro continua valendo.";

  return { conquista: conquistaDe(c), beneficio, proximoPasso };
}
