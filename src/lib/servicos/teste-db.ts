/**
 * Apoio dos testes de integração: banco real, usuários descartáveis.
 *
 * Só roda quando `ZXP_TESTE_DB=1`. Não existe banco de teste separado neste
 * projeto — o `.env.local` aponta para o Neon de produção — então a regra é:
 *   - todo usuário criado aqui tem e-mail `teste-…@zxpmark.local`;
 *   - o `limpar()` apaga só os que ESTE processo criou (e tudo que pende deles,
 *     em cascata) mais resíduos com mais de 1h de execuções que morreram no meio;
 *   - nenhum teste toca em linha que não tenha criado.
 *
 * Por que não apagar tudo com o prefixo: o `node --test` roda cada arquivo num
 * processo, em paralelo. Um `after` que apagasse todos os `teste-…` derrubaria
 * os usuários do arquivo vizinho no meio do teste.
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
/** ids criados por este processo — o que o `limpar` pode apagar sem medo. */
const criados: string[] = [];

export async function criarUsuarioDeTeste(db: PrismaClient, apelido: string, timezone = "America/Sao_Paulo") {
  const sorteio = Math.random().toString(36).slice(2, 8);
  const usuario = await db.user.create({
    data: {
      email: `teste-${apelido}-${sorteio}${SUFIXO}`,
      nome: `Teste ${apelido}`,
      senhaHash: "x",
      timezone,
    },
  });
  criados.push(usuario.id);
  return usuario;
}

/**
 * Apaga os usuários que este processo criou e os resíduos antigos de testes que
 * morreram sem limpar. O sufixo no e-mail e a idade mínima são a trava: nada
 * que não seja claramente de teste, e nada que outro processo possa estar usando.
 */
export async function limparUsuariosDeTeste(db: PrismaClient) {
  const umaHoraAtras = new Date(Date.now() - 60 * 60_000);
  await db.user.deleteMany({
    where: {
      email: { startsWith: "teste-", endsWith: SUFIXO },
      OR: [{ id: { in: criados } }, { criadoEm: { lt: umaHoraAtras } }],
    },
  });
}
