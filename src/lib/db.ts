import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// O driver do Neon fala WebSocket; em Node ele precisa de uma implementação.
neonConfig.webSocketConstructor = ws;

const global0 = globalThis as unknown as { prisma?: PrismaClient };

/** O Neon serve o mesmo banco por TCP e por WebSocket; só ele tem os dois. */
function ehNeon(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".neon.tech");
  } catch {
    return false;
  }
}

function criar(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";
  const log: ("error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  // Em serverless a saída TCP na 5432 nem sempre existe; o adapter do Neon
  // trafega por WebSocket na 443, que passa em qualquer lugar.
  if (ehNeon(url)) {
    return new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }), log });
  }

  return new PrismaClient({ log });
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
