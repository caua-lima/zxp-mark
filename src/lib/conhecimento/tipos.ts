/**
 * Base de conhecimento do ZXP Mark: tipos.
 *
 * O catálogo guarda só duas das cinco naturezas de informação que o produto
 * mostra. As outras três nascem do uso e NUNCA entram aqui:
 *
 *   1. Informação educativa apoiada em fonte  → `Afirmacao` (sempre com fontes)
 *   2. Dado registrado pelo usuário           → tabelas do banco
 *   3. Conquista calculada desses dados       → progressao.ts / regras de cada tema
 *   4. Percepção relatada pelo usuário        → Percepcao
 *   5. Sugestão prática                       → `Estrategia` (não é afirmação de saúde)
 *
 * A regra que organiza tudo: uma frase que afirma algo sobre saúde só existe
 * como `Afirmacao`, e `Afirmacao` sem fonte não compila no validador.
 *
 * Puro e sem alias: roda no servidor, no navegador e nos testes do Node.
 */

export type CategoriaTema = "habito" | "medicamento" | "rotina" | "bem-estar";

/**
 * Onde o conteúdo está na revisão:
 *  - "fontes-conferidas": cada afirmação foi comparada com a fonte lida, mas
 *    NÃO houve revisão por profissional de saúde.
 *  - "parcial": parte das fontes só foi vista por resumo de busca ou não foi
 *    acessada; o tema avisa isso.
 *  - "revisado-por-profissional": reservado para quando alguém habilitado
 *    revisar. Nenhum tema está neste estado hoje.
 */
export type StatusEditorial = "fontes-conferidas" | "parcial" | "revisado-por-profissional";

export type Fonte = {
  id: string;
  titulo: string;
  orgao: string;
  url: string;
  /** data que a própria página exibe; null se ela não exibe nenhuma */
  dataDaPagina: string | null;
  /** quando alguém do projeto conferiu o conteúdo contra a fonte */
  verificadoEm: string;
  /** "pagina lida": o texto foi lido. "resumo de busca": só o resumo do buscador. */
  verificacao: "pagina lida" | "resumo de busca";
  pais?: string;
  /** observação honesta: de que versão veio, o que não foi possível conferir */
  observacao?: string;
};

/** Uma afirmação educativa. `fontes` nunca é vazio — é isso que a torna afirmação. */
export type Afirmacao = {
  id: string;
  texto: string;
  fontes: string[];
  /** limite do que a frase quer dizer, mostrado junto quando relevante */
  ressalva?: string;
};

export type Estrategia = {
  id: string;
  titulo: string;
  texto: string;
  /** quando faz sentido oferecer: gatilhos em linguagem natural, para a seleção */
  quando?: string[];
  /** a estratégia vem de uma fonte? (ex.: a AAD sugere esmalte amargo) */
  fontes?: string[];
};

export type Faq = {
  id: string;
  pergunta: string;
  resposta: string;
  fontes?: string[];
  /** palavras e expressões que fazem esta pergunta ser relevante */
  termos: string[];
};

export type Dificuldade = { id: string; titulo: string; texto: string };

export type SinalDeAjuda = {
  texto: string;
  nivel: "converse-com-profissional" | "urgencia";
  fontes?: string[];
};

export type AcaoDoMarco =
  | "registrar-gatilho"
  | "escolher-alternativa"
  | "registrar-como-estou"
  | "ver-historico"
  | "registrar-efeito"
  | "preparar-consulta"
  | "nenhuma";

/**
 * Um marco de acompanhamento. Os números organizam a jornada; NÃO são prazos
 * de melhora. Cada marco tem duas versões do texto, porque o título forte só
 * pode aparecer quando os registros da pessoa o sustentam.
 */
export type Marco = {
  chave: string;
  /** na unidade do tema (dias, quase sempre) */
  limiar: number;
  /** quando os registros sustentam a contagem */
  titulo: string;
  texto: string;
  /** quando só o tempo passou e faltam registros: o que o app PODE dizer */
  tituloSemRegistro: string;
  textoSemRegistro: string;
  acoes: AcaoDoMarco[];
  /** afirmações educativas ligadas a este marco (ids de `beneficios`) */
  afirmacoes?: string[];
  /** o marco é um bom momento para falar com o profissional? */
  momentoDeConsulta?: boolean;
};

export type Rastreio =
  | { tipo: "episodios"; unidade: "dias" }
  | { tipo: "medicamento" }
  | { tipo: "pratica"; unidade: "minutos" | "vezes" | "dias" | "doses"; rotulo: string }
  | { tipo: "sono" }
  | { tipo: "marcos"; preset: string }
  | { tipo: "nenhum" };

export type Tema = {
  id: string;
  categoria: CategoriaTema;
  titulo: string;
  /** como a pessoa pode chamar isto: busca e reconhecimento */
  nomesAlternativos: string[];
  /** palavras soltas relacionadas, usadas na pontuação da busca */
  termos: string[];
  /** expressões regulares (sobre o texto normalizado) para jeitos de dizer que uma lista não cobre */
  padroes?: string[];
  descricao: string;
  objetivos: string[];
  beneficios: Afirmacao[];
  marcos: Marco[];
  estrategias: Estrategia[];
  faq: Faq[];
  dificuldades: Dificuldade[];
  sinaisDeAjuda: SinalDeAjuda[];
  /** o que o app NÃO pode afirmar sobre este tema — vira regra do assistente */
  limites: string[];
  /** o que vale observar (sem causalidade) */
  oQueObservar: string[];
  rastreio: Rastreio;
  versao: number;
  revisadoEm: string;
  status: StatusEditorial;
  /** o que ficou de fora e por quê; honestidade editorial */
  notaEditorial?: string;
};
