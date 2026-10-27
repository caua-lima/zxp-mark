/** Tipos de retorno compartilhados pelos serviços de saúde. */
export type Falha = { ok: false; erro: string; status: number };
export type Saida<T> = { ok: true; valor: T } | Falha;

export const falha = (erro: string, status = 400): Falha => ({ ok: false, erro, status });
export const ok = <T>(valor: T): Saida<T> => ({ ok: true, valor });

/**
 * "Não é seu" e "não existe" devolvem a MESMA resposta: de fora, ninguém
 * descobre ids alheios por tentativa.
 */
export const naoEncontrado = (o = "Registro"): Falha => falha(`${o} não encontrado.`, 404);

/** Violação de unicidade do Prisma (corrida entre duas requisições iguais). */
export const ehViolacaoDeUnico = (e: unknown): boolean =>
  typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
