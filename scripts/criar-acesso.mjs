/**
 * Cria (ou atualiza) um acesso direto no banco. Serve para o primeiro admin,
 * quando ainda não há ninguém logado para usar a aba Acesso.
 *
 *   node scripts/criar-acesso.mjs --email a@b.com --nome "Fulano" --admin
 *   node scripts/criar-acesso.mjs --email a@b.com --senha "minha-senha"
 *
 * Sem --senha, gera uma temporária forte e grava em ACESSO-TEMPORARIO.txt
 * (fora do git). O acesso nasce marcado para trocar a senha no primeiro uso.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hashSenha, senhaTemporaria } from "../src/lib/senha.ts";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

for (const arquivo of [".env", ".env.local"]) {
  const caminho = join(raiz, arquivo);
  if (!existsSync(caminho)) continue;
  for (const linha of readFileSync(caminho, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m || process.env[m[1]]) continue;
    const v = m[2].trim().replace(/^["'](.*)["']$/s, "$1");
    if (v) process.env[m[1]] = v;
  }
}

/** --chave valor | --flag */
function arg(nome) {
  const i = process.argv.indexOf(`--${nome}`);
  if (i === -1) return undefined;
  const proximo = process.argv[i + 1];
  return proximo && !proximo.startsWith("--") ? proximo : true;
}

const email = String(arg("email") ?? "").trim().toLowerCase();
const nome = String(arg("nome") ?? "").trim();
const admin = arg("admin") === true;
const senhaDada = typeof arg("senha") === "string" ? arg("senha") : null;

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("\nUso: node scripts/criar-acesso.mjs --email voce@dominio.com [--nome \"Seu Nome\"] [--admin] [--senha ...]\n");
  process.exit(1);
}
if (senhaDada && senhaDada.length < 8) {
  console.error("\nA senha precisa de pelo menos 8 caracteres.\n");
  process.exit(1);
}

const senha = senhaDada ?? senhaTemporaria();
const gerada = !senhaDada;

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

try {
  const existente = await prisma.user.findUnique({ where: { email }, select: { id: true, nome: true } });

  const dados = {
    senhaHash: hashSenha(senha),
    admin: admin || undefined,
    trocarSenha: gerada,
  };

  const u = existente
    ? await prisma.user.update({
        where: { email },
        data: { ...dados, ...(nome ? { nome } : {}) },
        select: { id: true, nome: true, email: true, admin: true },
      })
    : await prisma.user.create({
        data: { email, nome: nome || email.split("@")[0], ...dados, admin },
        select: { id: true, nome: true, email: true, admin: true },
      });

  console.log(`\n${existente ? "Acesso atualizado" : "Acesso criado"}:`);
  console.log(`  nome  : ${u.nome}`);
  console.log(`  e-mail: ${u.email}`);
  console.log(`  admin : ${u.admin ? "sim" : "não"}`);

  if (gerada) {
    const arquivo = join(raiz, "ACESSO-TEMPORARIO.txt");
    writeFileSync(
      arquivo,
      [
        "ACESSO TEMPORARIO — ZXP Mark",
        "",
        `E-mail: ${u.email}`,
        `Senha : ${senha}`,
        "",
        "Entre no app, va na aba Acesso e troque a senha.",
        "Depois disso apague este arquivo.",
        "",
        `Gerado em ${new Date().toLocaleString("pt-BR")}`,
        "",
      ].join("\n"),
      "utf8"
    );
    console.log(`\n  Senha temporária gravada em ACESSO-TEMPORARIO.txt`);
    console.log(`  (fora do git — troque a senha no app e apague o arquivo)`);
  } else {
    console.log("\n  Senha: a que você passou em --senha");
  }
  console.log("");
} finally {
  await prisma.$disconnect();
}
