import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";

const COOKIE = "zxp_sessao";
const DIAS = 60;

function segredo(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "AUTH_SECRET ausente ou curto demais. Defina uma string aleatória de 32+ caracteres nas variáveis de ambiente."
    );
  }
  return new TextEncoder().encode(s);
}

/* ------------------------------- senha ---------------------------------- */

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

/* ------------------------------- sessão --------------------------------- */

export async function criarSessao(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DIAS}d`)
    .sign(segredo());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DIAS * 24 * 60 * 60,
  });
}

export async function encerrarSessao() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Id do usuário logado, ou null. */
export async function usuarioId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, segredo());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export type Usuario = NonNullable<Awaited<ReturnType<typeof usuarioAtual>>>;

/** Usuário logado completo, ou null. */
export async function usuarioAtual() {
  const id = await usuarioId();
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      nome: true,
      timezone: true,
      notifMarcos: true,
      notifResumoDiario: true,
      notifNoite: true,
      horaResumo: true,
      horaNoite: true,
      criadoEm: true,
    },
  });
}
