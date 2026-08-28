import { PrismaClient } from "@prisma/client";

const global0 = globalThis as unknown as { prisma?: PrismaClient };

function criar(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/**
 * Cliente preguiçoso: só instancia de verdade no primeiro uso.
 *
 * Dois motivos. (1) O Prisma explode ao construir se `DATABASE_URL` não
 * existe — e a Vercel coleta os módulos no build, quando as variáveis podem
 * ainda não estar configuradas. (2) Guardar no globalThis evita que o
 * hot-reload do dev abra uma conexão nova a cada save.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_alvo, prop) {
    const cliente = (global0.prisma ??= criar());
    const valor = Reflect.get(cliente, prop, cliente);
    return typeof valor === "function" ? valor.bind(cliente) : valor;
  },
});
