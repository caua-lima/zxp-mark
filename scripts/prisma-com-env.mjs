/**
 * Roda o Prisma CLI enxergando o .env.local.
 *
 * O Next.js lê .env.local; o Prisma CLI só lê .env. Sem esta ponte,
 * `prisma db push` reclama que DATABASE_URL não existe mesmo com a variável
 * preenchida — e o erro não diz o porquê.
 *
 *   node scripts/prisma-com-env.mjs db push
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Lê um .env simples: IGNORA comentários, aspas e linhas vazias. */
function carregar(arquivo) {
  if (!existsSync(arquivo)) return 0;
  let n = 0;
  for (const linha of readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m) continue;
    const chave = m[1];
    // Quem já está no ambiente de verdade manda mais que o arquivo.
    if (process.env[chave]) continue;
    const valor = m[2].trim().replace(/^["'](.*)["']$/s, "$1");
    if (!valor) continue;
    process.env[chave] = valor;
    n++;
  }
  return n;
}

// .env primeiro, .env.local por cima — mesma precedência do Next.
carregar(join(raiz, ".env"));
carregar(join(raiz, ".env.local"));

if (!process.env.DATABASE_URL) {
  console.error(
    "\nDATABASE_URL não encontrada.\n\n" +
      "Abra o .env.local e cole a connection string do seu Postgres.\n" +
      "Se ainda não tem banco: crie um grátis em https://neon.tech e copie a\n" +
      "URL COM POOLER (a que tem `-pooler` no host).\n"
  );
  process.exit(1);
}

let alvo;
try {
  alvo = new URL(process.env.DATABASE_URL);
} catch {
  console.error("\nDATABASE_URL não é uma URL válida.\n");
  process.exit(1);
}

if (alvo.hostname === "localhost" || alvo.hostname === "127.0.0.1") {
  console.warn(
    `\nAviso: DATABASE_URL aponta para ${alvo.hostname} — ainda é o valor de exemplo.\n` +
      "Se não houver um Postgres rodando aí, o comando abaixo vai falhar.\n"
  );
}

// Sem DIRECT_URL, a migração usa a própria DATABASE_URL.
if (!process.env.DIRECT_URL) process.env.DIRECT_URL = process.env.DATABASE_URL;

// pgbouncer em modo transação (Supabase 6543) não suporta o DDL do db push:
// ele derruba prepared statements no meio da migração.
const migrando = process.argv.some((a) => a === "push" || a === "migrate" || a === "dev");
const direta = new URL(process.env.DIRECT_URL);
const emTransacao = direta.port === "6543" || direta.searchParams.get("pgbouncer") === "true";

if (migrando && emTransacao) {
  console.error(
    "\nDIRECT_URL está apontando para o pooler de TRANSAÇÃO (porta 6543).\n" +
      "A migração precisa de conexão direta, senão falha no meio.\n\n" +
      "No Supabase, copie a string do 'Session pooler' (porta 5432) e ponha em\n" +
      "DIRECT_URL no .env.local. A de transação (6543) continua na DATABASE_URL.\n"
  );
  process.exit(1);
}

const r = spawnSync("npx", ["prisma", ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: raiz,
  shell: process.platform === "win32",
});

process.exit(r.status ?? 1);
