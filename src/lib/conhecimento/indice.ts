/**
 * Busca e reconhecimento de temas. Sem banco vetorial e sem serviço externo:
 * o catálogo é pequeno e estruturado, então normalização + pontuação por termos
 * resolve, e é auditável (dá para explicar por que um tema foi escolhido).
 */
import type { Afirmacao, Estrategia, Faq, SinalDeAjuda, Tema } from "./tipos.ts";

const STOPWORDS = new Set(
  "a o as os um uma uns umas de do da dos das em no na nos nas por para pra com sem e ou mas que se eu me meu minha meus minhas voce vc tu ele ela isso isto esse essa esta este ja mais muito pouco como qual quais quando onde porque ser estou esta estao foi vai vou tem tenho ter ha mesmo so tambem ainda quanto quantos quanta quantas media".split(
    " "
  )
);

/** minúsculas, sem acento, só letras/dígitos separados por espaço */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokens(texto: string): string[] {
  return normalizar(texto)
    .split(" ")
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Distância de edição (Levenshtein), com corte para ser barata. */
export function distancia(a: string, b: string, corte = 3): number {
  if (Math.abs(a.length - b.length) > corte) return corte + 1;
  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    for (let j = 1; j <= b.length; j++) {
      atual[j] = Math.min(
        anterior[j] + 1,
        atual[j - 1] + 1,
        anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    anterior = atual;
  }
  return anterior[b.length];
}

/** True se `frase` (já normalizada) aparece no texto como palavra(s) inteira(s). */
function contemFrase(textoNormalizado: string, frase: string): boolean {
  return ` ${textoNormalizado} `.includes(` ${frase} `);
}

/* ----------------------------- reconhecimento ----------------------------- */

/**
 * Pares que NUNCA podem ser tratados como erro de digitação um do outro.
 * "citalopram" está a duas letras de "escitalopram" e é outro medicamento.
 */
export const NAO_CONFUNDIR: { digitado: string; naoE: string }[] = [
  { digitado: "citalopram", naoE: "escitalopram" },
];

export type Reconhecimento =
  | { tipo: "exato"; tema: Tema; termo: string }
  /** parece um erro de digitação: o app PERGUNTA, não assume */
  | { tipo: "incerto"; tema: Tema; digitado: string; sugestao: string }
  /** outro medicamento, que o app não pode tratar como o da base */
  | { tipo: "outro-medicamento"; digitado: string; naoE: string }
  | null;

export function reconhecer(texto: string, temas: Tema[]): Reconhecimento {
  const t = normalizar(texto);
  if (!t) return null;
  const palavras = t.split(" ");

  // 1. Pares que não podem se confundir: respondem antes de qualquer proximidade.
  for (const par of NAO_CONFUNDIR) {
    if (palavras.includes(par.digitado)) {
      return { tipo: "outro-medicamento", digitado: par.digitado, naoE: par.naoE };
    }
  }

  // 2. Frase conhecida, a mais longa vence ("oxalato de escitalopram" > "escitalopram").
  let melhor: { tema: Tema; termo: string } | null = null;
  for (const tema of temas) {
    const nomes = [tema.titulo, ...tema.nomesAlternativos].map(normalizar);
    for (const nome of nomes) {
      if (nome && contemFrase(t, nome) && (!melhor || nome.length > melhor.termo.length)) {
        melhor = { tema, termo: nome };
      }
    }
    for (const padrao of tema.padroes ?? []) {
      const m = new RegExp(padrao).exec(t);
      if (m && (!melhor || m[0].length > melhor.termo.length)) melhor = { tema, termo: m[0] };
    }
  }
  if (melhor) return { tipo: "exato", ...melhor };

  // 3. Erro de digitação em nome de MEDICAMENTO: só sugere.
  for (const tema of temas.filter((x) => x.categoria === "medicamento")) {
    const alvos = [tema.titulo, ...tema.nomesAlternativos].map(normalizar).filter((n) => !n.includes(" "));
    for (const palavra of palavras) {
      if (palavra.length < 8) continue;
      for (const alvo of alvos) {
        if (alvo.length < 8) continue;
        const d = distancia(palavra, alvo, 2);
        if (d >= 1 && d <= 2) return { tipo: "incerto", tema, digitado: palavra, sugestao: alvo };
      }
    }
  }
  return null;
}

/* --------------------------------- busca ---------------------------------- */

export type ResultadoBusca = { tema: Tema; pontos: number };

export function buscar(consulta: string, temas: Tema[]): ResultadoBusca[] {
  const q = normalizar(consulta);
  if (!q) return [];
  const qs = tokens(consulta);
  const resultados: ResultadoBusca[] = [];

  for (const tema of temas) {
    let pontos = 0;
    const nomes = [tema.titulo, ...tema.nomesAlternativos].map(normalizar);
    // Palavras inteiras, nos dois sentidos. `includes` simples faria "citalopram"
    // casar com "escitalopram", que é outro medicamento.
    for (const n of nomes) if (n && (contemFrase(q, n) || contemFrase(n, q))) pontos += 10;
    for (const padrao of tema.padroes ?? []) if (new RegExp(padrao).test(q)) pontos += 8;

    const vocab = new Set([
      ...tokens(tema.titulo),
      ...tema.nomesAlternativos.flatMap(tokens),
      ...tema.termos.flatMap(tokens),
    ]);
    for (const w of qs) {
      if (vocab.has(w)) pontos += 3;
      else if (w.length >= 5 && [...vocab].some((v) => v.length >= 5 && (v.startsWith(w) || w.startsWith(v)))) pontos += 1;
    }
    if (pontos > 0) resultados.push({ tema, pontos });
  }
  return resultados.sort((a, b) => b.pontos - a.pontos);
}

/* ----------------------------- seleção por pergunta ----------------------- */

/** Palavras que pedem prioridade aos sinais de procurar ajuda, não à celebração. */
export const PALAVRAS_DE_ALERTA =
  /\b(pior|piorei|piorou|piora|muito mal|nao aguento|desespero|suicid|me matar|morrer|me machucar|automutila|crise|urgencia|convuls|desmai|alucina|sangr)\w*/;

export type Selecao = {
  faq: Faq[];
  estrategias: Estrategia[];
  beneficios: Afirmacao[];
  sinais: SinalDeAjuda[];
  /** a pergunta tem sinais de alerta: o conteúdo de procurar ajuda vem primeiro */
  alerta: boolean;
};

/**
 * Raiz aproximada para casar flexões do português ("recuperar" / "recuperaram",
 * "esquecer" / "esqueci"): palavras de 7+ letras comparam pelas 6 primeiras.
 */
const raiz = (w: string) => (w.length >= 7 ? w.slice(0, 6) : w);

/** Abaixo disto, a coincidência é acaso (uma palavra solta) e o item não é devolvido. */
const RELEVANCIA_MINIMA = 2;

function pontuar(pergunta: string, frases: string[], extra = "", ignorar: Set<string> = new Set()): number {
  const qn = normalizar(pergunta);
  // O nome do próprio tema não diz QUAL pergunta é: ignorá-lo evita que
  // "escitalopram engorda?" seja respondido com outra pergunta que também tem "escitalopram".
  const qs = new Set(tokens(pergunta).filter((w) => !ignorar.has(w)).map(raiz));
  let p = 0;
  for (const f of frases) {
    const fn = normalizar(f);
    if (!fn) continue;
    if (contemFrase(qn, fn)) p += 4;
    else for (const w of tokens(f)) if (qs.has(raiz(w))) p += 1;
  }
  for (const w of tokens(extra)) if (qs.has(raiz(w))) p += 0.5;
  return p;
}

/**
 * Escolhe SÓ o que serve à pergunta, em vez de despejar o tema inteiro:
 * é o que mantém o assistente (e o prompt do modelo) enxutos e rastreáveis.
 */
export function selecionar(tema: Tema, pergunta: string, max = 3): Selecao {
  const alerta = PALAVRAS_DE_ALERTA.test(normalizar(pergunta));
  const nomeDoTema = new Set([...tokens(tema.titulo), ...tema.nomesAlternativos.flatMap(tokens)]);

  const faq = tema.faq
    .map((f) => ({ f, p: pontuar(pergunta, f.termos, f.pergunta, nomeDoTema) }))
    .filter((x) => x.p >= RELEVANCIA_MINIMA)
    .sort((a, b) => b.p - a.p)
    .slice(0, max)
    .map((x) => x.f);

  const estrategias = tema.estrategias
    .map((e) => ({ e, p: pontuar(pergunta, e.quando ?? [], `${e.titulo} ${e.texto}`, nomeDoTema) }))
    .filter((x) => x.p >= RELEVANCIA_MINIMA)
    .sort((a, b) => b.p - a.p)
    .slice(0, max)
    .map((x) => x.e);

  const beneficios = tema.beneficios
    .map((b) => ({ b, p: pontuar(pergunta, [], b.texto, nomeDoTema) }))
    .filter((x) => x.p >= RELEVANCIA_MINIMA)
    .sort((a, b) => b.p - a.p)
    .slice(0, max)
    .map((x) => x.b);

  return { faq, estrategias, beneficios, sinais: alerta ? tema.sinaisDeAjuda : [], alerta };
}
