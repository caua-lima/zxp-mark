/**
 * Contagem crescente ("Desde o início"): o tempo corrido desde uma data.
 *
 * Regra de ouro deste módulo: o contador mede TEMPO, e só isso. Ele não sabe se
 * uma dose foi tomada, se a rotina foi cumprida ou se o projeto avançou — por
 * isso nenhum texto aqui afirma nada disso. "12 dias desde o início do
 * tratamento" é verdade; "12 dias de tratamento em dia" não seria.
 *
 * Puro e sem alias: roda no Node, no servidor e no navegador.
 */
import { DIA_MS, HORA_MS, MIN_MS, diasCompletos, diaCalendario, instanteLocal } from "./datas.ts";

export type Categoria = "tratamento" | "rotina" | "projeto" | "pessoal";
export type Tom = "magenta" | "marfim" | "sucesso";

export type DefCategoria = {
  id: Categoria;
  rotulo: string;
  emoji: string;
  /** ícones sugeridos; a pessoa também pode escolher qualquer um da grade */
  emojis: string[];
  /** "desde o início do tratamento" — o complemento do contador */
  desde: string;
  placeholder: string;
  /** aviso fixo, quando a categoria pede cuidado com o que o contador significa */
  aviso?: string;
};

export const CATEGORIAS: DefCategoria[] = [
  {
    id: "tratamento",
    rotulo: "Tratamento",
    emoji: "🩺",
    emojis: ["🩺", "💊", "🦷", "🧘", "🩹", "🌡️"],
    desde: "desde o início do tratamento",
    placeholder: "Início do tratamento",
    aviso:
      "Este contador mostra o tempo desde a data que você informou. Ele não registra doses tomadas e não substitui a orientação de quem acompanha o seu tratamento.",
  },
  {
    id: "rotina",
    rotulo: "Rotina",
    emoji: "🌱",
    emojis: ["🌱", "🏃", "📚", "🧘", "🥗", "💧"],
    desde: "desde o início da rotina",
    placeholder: "Nova rotina de estudos",
  },
  {
    id: "projeto",
    rotulo: "Projeto",
    emoji: "🛠️",
    emojis: ["🛠️", "🎯", "💻", "🎨", "✍️", "📈"],
    desde: "desde o início do projeto",
    placeholder: "Reforma da casa",
  },
  {
    id: "pessoal",
    rotulo: "Outro acontecimento",
    emoji: "📍",
    emojis: ["📍", "🏡", "💞", "🎓", "🌟", "🕊️"],
    desde: "desde o início",
    placeholder: "Quando me mudei",
  },
];

export const TONS: { id: Tom; rotulo: string }[] = [
  { id: "magenta", rotulo: "Magenta" },
  { id: "marfim", rotulo: "Marfim" },
  { id: "sucesso", rotulo: "Verde" },
];

export function categoria(id: string): DefCategoria {
  return CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[CATEGORIAS.length - 1];
}

export function ehCategoria(v: unknown): v is Categoria {
  return CATEGORIAS.some((c) => c.id === v);
}
export function ehTom(v: unknown): v is Tom {
  return TONS.some((t) => t.id === v);
}

/** Quantos acompanhamentos ativos+arquivados uma conta pode ter. */
export const LIMITE_ACOMPANHAMENTOS = 50;

/** Folga para relógios do celular um pouco adiantados. */
const TOLERANCIA_FUTURO_MS = 5 * MIN_MS;
/** Mais antigo que isso quase certamente é o ano digitado errado. */
const ANOS_MAXIMOS = 100;

export type EntradaAcompanhamento = {
  titulo?: string;
  categoria?: string;
  emoji?: string;
  tom?: string;
  descricao?: string | null;
  /** "2026-10-01" ou "2026-10-01T08:30", no fuso do usuário. Sem hora = 00:00. */
  inicio?: string;
};

export type AcompanhamentoNormalizado = {
  titulo: string;
  categoria: Categoria;
  emoji: string;
  tom: Tom;
  descricao: string | null;
  inicio: Date;
};

type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string };

/** Primeiro caractere "visível" de um emoji: aceita sequências com ZWJ/variação. */
function emojiValido(e: string): boolean {
  const t = e.trim();
  if (!t || t.length > 16) return false;
  // Precisa ter ao menos um símbolo pictográfico; texto comum não passa.
  return /\p{Extended_Pictographic}/u.test(t);
}

function validarInicio(
  texto: string | undefined,
  tz: string,
  agora: number
): Resultado<Date> {
  const inicio = instanteLocal(texto ?? "", tz);
  if (!inicio) return { ok: false, erro: "Escolha uma data de início válida." };
  if (inicio.getTime() > agora + TOLERANCIA_FUTURO_MS) {
    return {
      ok: false,
      erro: "A data de início ainda não chegou. Para contar até uma data futura, use a aba Regressiva.",
    };
  }
  if (agora - inicio.getTime() > ANOS_MAXIMOS * 365 * DIA_MS) {
    return { ok: false, erro: "Essa data está muito distante. Confira o ano." };
  }
  return { ok: true, valor: inicio };
}

/** Cria: todos os campos obrigatórios passam por aqui. */
export function interpretarNovo(
  e: EntradaAcompanhamento,
  tz: string,
  agora: number = Date.now()
): Resultado<AcompanhamentoNormalizado> {
  const titulo = (e.titulo ?? "").trim();
  if (titulo.length < 2) return { ok: false, erro: "Dê um nome ao acompanhamento." };
  if (titulo.length > 80) return { ok: false, erro: "O nome aceita até 80 caracteres." };

  const cat = e.categoria ?? "pessoal";
  if (!ehCategoria(cat)) return { ok: false, erro: "Escolha uma categoria da lista." };

  const tom = e.tom ?? "magenta";
  if (!ehTom(tom)) return { ok: false, erro: "Escolha uma cor da lista." };

  const emoji = (e.emoji ?? "").trim() || categoria(cat).emoji;
  if (!emojiValido(emoji)) return { ok: false, erro: "Escolha um ícone da lista." };

  const descricao = (e.descricao ?? "").trim();
  if (descricao.length > 500) return { ok: false, erro: "A descrição aceita até 500 caracteres." };

  const inicio = validarInicio(e.inicio, tz, agora);
  if (!inicio.ok) return inicio;

  return {
    ok: true,
    valor: { titulo, categoria: cat, emoji, tom, descricao: descricao || null, inicio: inicio.valor },
  };
}

/** Edita: só valida o que veio; o que não veio fica como está. */
export function interpretarEdicao(
  e: EntradaAcompanhamento,
  tz: string,
  agora: number = Date.now()
): Resultado<Partial<AcompanhamentoNormalizado>> {
  const saida: Partial<AcompanhamentoNormalizado> = {};

  if (e.titulo !== undefined) {
    const titulo = e.titulo.trim();
    if (titulo.length < 2) return { ok: false, erro: "Dê um nome ao acompanhamento." };
    if (titulo.length > 80) return { ok: false, erro: "O nome aceita até 80 caracteres." };
    saida.titulo = titulo;
  }
  if (e.categoria !== undefined) {
    if (!ehCategoria(e.categoria)) return { ok: false, erro: "Escolha uma categoria da lista." };
    saida.categoria = e.categoria;
  }
  if (e.tom !== undefined) {
    if (!ehTom(e.tom)) return { ok: false, erro: "Escolha uma cor da lista." };
    saida.tom = e.tom;
  }
  if (e.emoji !== undefined) {
    if (!emojiValido(e.emoji)) return { ok: false, erro: "Escolha um ícone da lista." };
    saida.emoji = e.emoji.trim();
  }
  if (e.descricao !== undefined) {
    const d = (e.descricao ?? "").trim();
    if (d.length > 500) return { ok: false, erro: "A descrição aceita até 500 caracteres." };
    saida.descricao = d || null;
  }
  if (e.inicio !== undefined) {
    const inicio = validarInicio(e.inicio, tz, agora);
    if (!inicio.ok) return inicio;
    saida.inicio = inicio.valor;
  }
  return { ok: true, valor: saida };
}

export type Tempo = {
  /** 1 dia completo = 24h vividas desde o início */
  diasCompletos: number;
  /** o dia do início é o dia 1 */
  diaN: number;
  /** o número que domina o cartão, e a unidade dele */
  heroi: { valor: number; unidade: "dia" | "dias" | "hora" | "horas" | "min" };
  /** frase completa e honesta: "12 dias desde o início do tratamento" */
  frase: string;
};

/**
 * Como mostrar o tempo. Antes de completar 24h o herói são as horas: "0 dias"
 * é verdadeiro e desanima, enquanto "5 horas · dia 1" diz a mesma coisa
 * sem soar como zero.
 */
export function descreverTempo(
  cat: string,
  inicio: Date | number,
  agora: Date | number,
  tz: string
): Tempo {
  const dc = diasCompletos(inicio, agora);
  const diaN = diaCalendario(inicio, agora, tz);
  const ms = Math.max(0, new Date(agora).getTime() - new Date(inicio).getTime());
  const desde = categoria(cat).desde;

  if (dc >= 1) {
    return {
      diasCompletos: dc,
      diaN,
      heroi: { valor: dc, unidade: dc === 1 ? "dia" : "dias" },
      frase: `${dc} ${dc === 1 ? "dia" : "dias"} ${desde}`,
    };
  }

  const horas = Math.floor(ms / HORA_MS);
  if (horas >= 1) {
    return {
      diasCompletos: 0,
      diaN,
      heroi: { valor: horas, unidade: horas === 1 ? "hora" : "horas" },
      frase: `${horas} ${horas === 1 ? "hora" : "horas"} ${desde}`,
    };
  }
  const min = Math.floor(ms / MIN_MS);
  return {
    diasCompletos: 0,
    diaN,
    heroi: { valor: min, unidade: "min" },
    frase: "Acabou de começar",
  };
}
