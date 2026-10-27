/**
 * Validador editorial do catálogo. Devolve uma lista de problemas (vazia = ok).
 *
 * Existe para que as regras do projeto sejam mecânicas, não memória de quem
 * escreve o próximo tema:
 *  - afirmação de saúde só com fonte que existe;
 *  - nada de promessa clínica, de diagnóstico, de instrução de dose;
 *  - nenhum telefone de emergência de outro país;
 *  - tema com fonte só vista por resumo precisa estar marcado "parcial".
 */
import type { Fonte, Tema } from "./tipos.ts";

/** Linguagem de promessa e de pressão. Aplicada a TODO texto de tema. */
export const PROMESSAS =
  // O "é" acentuado não conta como letra para \b, então a forma afirmativa de
  // "comprovado" fica numa alternativa própria — e "não há prazo comprovado",
  // que é o oposto de uma promessa, continua permitido.
  /\b(garant\w*|cura\w*|curad[oa]s?|certamente|com certeza|100%|milagr\w*|resultado assegurado|vai melhorar|voc[eê] j[aá] deveria|j[aá] deveria estar|perdeu (a |o |sua |seu )?(sequ[eê]ncia|progresso)|perder (a |sua )?sequ[eê]ncia|n[aã]o pode falhar|precisa continuar para|funciona mais r[aá]pido|normaliz\w+ (a |sua )?serotonina|serotonina (est[aá] )?normaliz\w+|% conclu[ií]d\w+)|(?:^|\s)(?:[eé]|s[aã]o|est[aá]|est[aã]o|foi|foram|cientificamente|totalmente|plenamente) comprovad[oa]s?/i;

/** Dizer a quem usa medicamento o que fazer com a dose. */
export const INSTRUCAO_DE_DOSE =
  // Cada alternativa admite a negação ("não tome em dobro", "não pare de tomar"),
  // que é exatamente o que a bula orienta e o app precisa poder dizer.
  /(?<!n[aã]o )\b(aumente|aumentar a dose|reduza|reduzir a dose|diminua a dose|suspenda|dobre a dose|compense a dose)\b|(?<!n[aã]o )\btome (a dose )?(o dobro|em dobro|dois comprimidos)\b|(?<!n[aã]o )\b(pare|parar) de tomar\b/i;

/** Diagnosticar a pessoa a partir de um comportamento ou de um registro. */
export const DIAGNOSTICO =
  /\bvoc[eê] (tem|sofre de|est[aá] com) (ansiedade|depress[aã]o|toc|transtorno)\b|\bisso (indica|significa que voc[eê] tem|é sinal de) (ansiedade|depress[aã]o|toc|transtorno)\b/i;

/** Telefones de outros países. O Brasil usa 188 (CVV), 192 (SAMU), 190, 193. */
export const TELEFONE_ESTRANGEIRO = /\b(911|999|111|112|1-800|0800 ?\d{3} ?\d{4})\b/;

/** Termos que, numa frase sem fonte, caracterizam uma afirmação de saúde. */
const TERMOS_DE_SAUDE =
  /(infec[cç]|risco|benef[ií]cio|recupera|cicatriz|sintoma|efeito colateral|efeitos adversos|\bdose\b|antidepress|serotonin|inflama|les[aã]o|doen[cç]a|diagn[oó]stic)/i;

const ISO = /^\d{4}-\d{2}-\d{2}$/;

type Opcoes = { fontes: Record<string, Fonte> };

function textosDoTema(t: Tema): { onde: string; texto: string; temFonte: boolean; obrigaFonte: boolean }[] {
  const saida: { onde: string; texto: string; temFonte: boolean; obrigaFonte: boolean }[] = [];
  const add = (onde: string, texto: string, temFonte = true, obrigaFonte = false) =>
    saida.push({ onde, texto, temFonte, obrigaFonte });

  add("descricao", t.descricao);
  t.objetivos.forEach((x, i) => add(`objetivos[${i}]`, x));
  t.beneficios.forEach((b) => add(`beneficios.${b.id}`, b.texto + " " + (b.ressalva ?? "")));
  t.marcos.forEach((m) => {
    add(`marcos.${m.chave}.titulo`, m.titulo);
    add(`marcos.${m.chave}.texto`, m.texto);
    add(`marcos.${m.chave}.tituloSemRegistro`, m.tituloSemRegistro);
    add(`marcos.${m.chave}.textoSemRegistro`, m.textoSemRegistro);
  });
  t.estrategias.forEach((e) => add(`estrategias.${e.id}`, `${e.titulo} ${e.texto}`, (e.fontes?.length ?? 0) > 0, true));
  t.faq.forEach((f) => add(`faq.${f.id}`, `${f.pergunta} ${f.resposta}`, (f.fontes?.length ?? 0) > 0, true));
  t.dificuldades.forEach((d) => add(`dificuldades.${d.id}`, `${d.titulo} ${d.texto}`));
  t.sinaisDeAjuda.forEach((s, i) => add(`sinaisDeAjuda[${i}]`, s.texto));
  t.limites.forEach((x, i) => add(`limites[${i}]`, x));
  t.oQueObservar.forEach((x, i) => add(`oQueObservar[${i}]`, x));
  return saida;
}

export function validarTema(t: Tema, { fontes }: Opcoes): string[] {
  const p: string[] = [];
  const falha = (m: string) => p.push(`${t.id}: ${m}`);

  if (!/^[a-z0-9-]+$/.test(t.id)) falha(`id inválido "${t.id}"`);
  if (t.titulo.trim().length < 3) falha("título vazio");
  if (t.descricao.trim().length < 40) falha("descrição curta demais");
  if (t.nomesAlternativos.length < 1) falha("sem nomes alternativos");
  if (t.termos.length < 3) falha("poucos termos de busca");
  if (t.objetivos.length < 2) falha("menos de 2 objetivos");
  if (t.beneficios.length < 1) falha("sem benefícios");
  if (t.estrategias.length < 3) falha("menos de 3 estratégias");
  if (t.faq.length < 3) falha("menos de 3 perguntas frequentes");
  if (t.dificuldades.length < 2) falha("menos de 2 dificuldades comuns");
  if (t.sinaisDeAjuda.length < 1) falha("sem sinais para procurar ajuda");
  if (t.limites.length < 2) falha("menos de 2 limites do que o app pode afirmar");
  if (t.oQueObservar.length < 2) falha("menos de 2 itens em 'o que observar'");
  if (!ISO.test(t.revisadoEm)) falha("revisadoEm não é uma data ISO");
  if (!Number.isInteger(t.versao) || t.versao < 1) falha("versão inválida");

  /* ---- unicidade ---- */
  const unico = (nome: string, ids: string[]) => {
    const vistos = new Set<string>();
    for (const id of ids) {
      if (vistos.has(id)) falha(`${nome} com id repetido: ${id}`);
      vistos.add(id);
    }
  };
  unico("beneficios", t.beneficios.map((b) => b.id));
  unico("marcos", t.marcos.map((m) => m.chave));
  unico("estrategias", t.estrategias.map((e) => e.id));
  unico("faq", t.faq.map((f) => f.id));
  unico("dificuldades", t.dificuldades.map((d) => d.id));

  /* ---- fontes ---- */
  const usadas = new Set<string>();
  const conferir = (onde: string, ids: string[] | undefined) => {
    for (const id of ids ?? []) {
      usadas.add(id);
      if (!fontes[id]) falha(`${onde}: fonte "${id}" não existe no registro`);
    }
  };
  for (const b of t.beneficios) {
    if (b.fontes.length === 0) falha(`beneficios.${b.id}: afirmação sem fonte`);
    conferir(`beneficios.${b.id}`, b.fontes);
  }
  t.estrategias.forEach((e) => conferir(`estrategias.${e.id}`, e.fontes));
  t.faq.forEach((f) => conferir(`faq.${f.id}`, f.fontes));
  t.sinaisDeAjuda.forEach((s, i) => conferir(`sinaisDeAjuda[${i}]`, s.fontes));

  const idsBeneficio = new Set(t.beneficios.map((b) => b.id));
  for (const m of t.marcos) {
    for (const a of m.afirmacoes ?? []) {
      if (!idsBeneficio.has(a)) falha(`marcos.${m.chave}: afirmação "${a}" não existe em beneficios`);
    }
  }

  /* ---- marcos em ordem ---- */
  for (let i = 1; i < t.marcos.length; i++) {
    if (t.marcos[i].limiar <= t.marcos[i - 1].limiar) {
      falha(`marcos fora de ordem: ${t.marcos[i - 1].chave} → ${t.marcos[i].chave}`);
    }
  }
  for (const m of t.marcos) {
    if (!m.titulo.trim() || !m.tituloSemRegistro.trim()) falha(`marcos.${m.chave}: título vazio`);
    if (m.titulo === m.tituloSemRegistro) falha(`marcos.${m.chave}: título forte e fraco iguais`);
  }

  /* ---- o tema só pode ser "fontes-conferidas" se todas as fontes foram lidas ---- */
  const fraca = [...usadas].filter((id) => fontes[id]?.verificacao !== "pagina lida");
  if (fraca.length > 0 && t.status === "fontes-conferidas") {
    falha(`status "fontes-conferidas" mas usa fonte não lida por inteiro: ${fraca.join(", ")}`);
  }
  if (t.status === "revisado-por-profissional") {
    falha('status "revisado-por-profissional" só pode ser usado com uma revisão real registrada');
  }

  /* ---- linguagem proibida e afirmação de saúde sem fonte ---- */
  for (const { onde, texto, temFonte, obrigaFonte } of textosDoTema(t)) {
    if (PROMESSAS.test(texto)) falha(`${onde}: linguagem de promessa → "${texto.match(PROMESSAS)?.[0]}"`);
    if (INSTRUCAO_DE_DOSE.test(texto)) falha(`${onde}: instrução de dose → "${texto.match(INSTRUCAO_DE_DOSE)?.[0]}"`);
    if (DIAGNOSTICO.test(texto)) falha(`${onde}: diagnóstico → "${texto.match(DIAGNOSTICO)?.[0]}"`);
    if (TELEFONE_ESTRANGEIRO.test(texto)) falha(`${onde}: telefone de outro país → "${texto.match(TELEFONE_ESTRANGEIRO)?.[0]}"`);
    if (obrigaFonte && !temFonte && TERMOS_DE_SAUDE.test(texto)) {
      falha(`${onde}: afirmação de saúde sem fonte → "${texto.match(TERMOS_DE_SAUDE)?.[0]}"`);
    }
  }

  return p;
}

/** Fontes usadas por um tema, na ordem de aparição e sem repetir. */
export function fontesDoTema(t: Tema, fontes: Record<string, Fonte>): Fonte[] {
  const ids: string[] = [];
  const add = (xs?: string[]) => xs?.forEach((x) => !ids.includes(x) && ids.push(x));
  t.beneficios.forEach((b) => add(b.fontes));
  t.estrategias.forEach((e) => add(e.fontes));
  t.faq.forEach((f) => add(f.fontes));
  t.sinaisDeAjuda.forEach((s) => add(s.fontes));
  return ids.map((id) => fontes[id]).filter(Boolean);
}
