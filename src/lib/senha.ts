import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hash de senha com scrypt da própria stdlib do Node — sem dependência
 * externa. Fica isolado aqui (sem importar nada do Next) para que os scripts
 * de linha de comando possam usar exatamente o mesmo algoritmo do app.
 */

const N = 16384;
const R = 8;
const P = 1;
const TAM = 64;

export function hashSenha(senha: string): string {
  const sal = randomBytes(16);
  const chave = scryptSync(senha.normalize("NFKC"), sal, TAM, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${sal.toString("base64")}$${chave.toString("base64")}`;
}

export function conferirSenha(senha: string, guardado: string): boolean {
  try {
    const [alg, n, r, p, salB64, chaveB64] = guardado.split("$");
    if (alg !== "scrypt") return false;
    const sal = Buffer.from(salB64, "base64");
    const esperada = Buffer.from(chaveB64, "base64");
    const calculada = scryptSync(senha.normalize("NFKC"), sal, esperada.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    return calculada.length === esperada.length && timingSafeEqual(calculada, esperada);
  } catch {
    return false;
  }
}

/** Senha temporária legível: 4 blocos de 4 caracteres sem ambiguidade visual. */
export function senhaTemporaria(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(16);
  const chars = [...bytes].map((b) => alfabeto[b % alfabeto.length]);
  return [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join("")).join("-");
}
