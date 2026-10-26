/**
 * Apoio dos testes de integração: banco real, usuários descartáveis.
 *
 * Só roda quando `ZXP_TESTE_DB=1`. Não existe banco de teste separado neste
 * projeto — o `.env.local` aponta para o Neon de produção — então a regra é:
 *   - todo usuário criado aqui tem e-mail `teste-…@zxpmark.local`;
 *   - o `limpar()` apaga só eles (e tudo que pende deles, em cascata);
 *   - nenhum teste toca em linha que não tenha criado.
 *
 * Nada deste arquivo é importado pelo app.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

export const TESTE_DB_LIGADO = process.env.ZXP_TESTE_DB === "1";

function carregarEnv() {
  for (const arquivo of [".env", ".env.local"]) {
    const caminho = join(process.cwd(), arquivo);
    if (!existsSync(caminho)) continue;
    for (const linha of readFileSync(caminho, "utf8").split(/\r?\n/)) {
      const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
      if (!m || process.env[m[1]]) continue;
      const v = m[2].trim().replace(/^["'](.*)["']$/s, "$1");
      if (v) process.env[m[1]] = v;
    }
  }
}

export function abrirBanco(): PrismaClient {
  carregarEnv();
  neonConfig.webSocketConstructor = ws;
  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL ?? "" }),
  });
}

const SUFIXO = "@zxpmark.local";

export async function criarUsuarioDeTeste(db: PrismaClient, apelido: string, timezone = "America/Sao_Paulo") {
  const sorteio = Math.random().toString(36).slice(2, 8);
  return db.user.create({
    data: {
      email: `teste-${apelido}-${sorteio}${SUFIXO}`,
      nome: `Teste ${apelido}`,
      senhaHash: "x",
      timezone,
    },
  });
}

/** Apaga SÓ os usuários de teste. O filtro por sufixo é a trava de segurança. */
export async function limparUsuariosDeTeste(db: PrismaClient) {
  await db.user.deleteMany({ where: { email: { startsWith: "teste-", endsWith: SUFIXO } } });
}
