/**
 * Gera as chaves VAPID (identidade do servidor perante o Apple Push) e o
 * AUTH_SECRET/CRON_SECRET, criando ou completando o .env.local.
 *
 *   npm run vapid
 */
import webpush from "web-push";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const arquivo = join(raiz, ".env.local");

const atual = existsSync(arquivo) ? readFileSync(arquivo, "utf8") : "";
const tem = (chave) => new RegExp(`^${chave}=.+`, "m").test(atual);

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

const novas = {
  VAPID_PUBLIC_KEY: publicKey,
  VAPID_PRIVATE_KEY: privateKey,
  VAPID_SUBJECT: "mailto:voce@exemplo.com",
  AUTH_SECRET: randomBytes(48).toString("base64url"),
  CRON_SECRET: randomBytes(32).toString("base64url"),
};

const adicionar = [];
const mantidas = [];
for (const [chave, valor] of Object.entries(novas)) {
  if (tem(chave)) mantidas.push(chave);
  else adicionar.push(`${chave}=${valor}`);
}

if (adicionar.length === 0) {
  console.log("Nada a fazer: .env.local já tem todas as chaves.");
} else {
  const cabecalho = atual.trim() ? `${atual.trimEnd()}\n\n` : "";
  writeFileSync(arquivo, `${cabecalho}${adicionar.join("\n")}\n`, "utf8");
  console.log(`Escrevi ${adicionar.length} variável(is) em .env.local:\n`);
  for (const linha of adicionar) console.log(`  ${linha.split("=")[0]}`);
}

if (mantidas.length) console.log(`\nMantidas como estavam: ${mantidas.join(", ")}`);

console.log(`\nCHAVE PÚBLICA VAPID (pode ser exposta):\n  ${publicKey}`);
console.log(
  "\nCole as MESMAS variáveis nas Environment Variables do projeto na Vercel.\n" +
    "Se trocar as chaves VAPID depois, todo mundo precisa reativar as notificações."
);
