/**
 * Monta o bloco de variáveis para colar na Vercel.
 *
 *   npm run vercel-env
 *
 * A Vercel aceita colar um .env inteiro em Settings > Environment Variables,
 * então o script escreve VERCEL-ENV.txt (fora do git) já sem o que só existe
 * na máquina local. Rode de novo sempre que trocar alguma chave.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const origem = join(raiz, ".env.local");
const destino = join(raiz, "VERCEL-ENV.txt");

if (!existsSync(origem)) {
  console.error("\n.env.local não existe. Rode `npm run vapid` primeiro.\n");
  process.exit(1);
}

/** Só a migração local usa; a Vercel deduz ou não precisa. */
const SO_LOCAL = new Set(["DIRECT_URL"]);

const OBRIGATORIAS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "CRON_SECRET",
];

const valores = new Map();
for (const linha of readFileSync(origem, "utf8").split(/\r?\n/)) {
  const m = linha.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) continue;
  const valor = m[2].trim().replace(/^["'](.*)["']$/s, "$1");
  if (valor) valores.set(m[1], valor);
}

const faltando = OBRIGATORIAS.filter((k) => !valores.has(k));
if (faltando.length) {
  console.error(`\nFaltam no .env.local: ${faltando.join(", ")}\n`);
  process.exit(1);
}

const linhas = [...valores.entries()]
  .filter(([k]) => !SO_LOCAL.has(k))
  .map(([k, v]) => `${k}=${v}`);

writeFileSync(destino, `${linhas.join("\n")}\n`, "utf8");

console.log(`\nEscrevi ${linhas.length} variáveis em VERCEL-ENV.txt:\n`);
for (const [k] of valores) {
  if (SO_LOCAL.has(k)) continue;
  console.log(`  ${k}`);
}
console.log(
  "\nNa Vercel: Settings > Environment Variables > cole o arquivo inteiro.\n" +
    "Depois: Deployments > Redeploy (variável nova não entra em deploy antigo).\n" +
    "Apague o VERCEL-ENV.txt quando terminar.\n"
);
