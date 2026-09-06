/**
 * Gera os ícones do PWA a partir dos arquivos oficiais da marca ZXP Solutions
 * em public/marca — nada é redesenhado aqui.
 *
 * Decodifica o PNG de 1024, reamostra por média de área (nítido em qualquer
 * tamanho) e reencoda. Só zlib do Node, sem dependência de imagem.
 */
import { deflateSync, inflateSync } from "node:zlib";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const marca = join(raiz, "public", "marca");
const saida = join(raiz, "public", "icons");
mkdirSync(saida, { recursive: true });

/** Onyx da marca — fundo dos ícones opacos. */
const ONYX = [0x10, 0x10, 0x0e];

/* ------------------------------- PNG: CRC -------------------------------- */

const TABELA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TABELA[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* ------------------------------ decodificar ------------------------------ */

function lerPng(caminho) {
  const b = readFileSync(caminho);
  const largura = b.readUInt32BE(16);
  const altura = b.readUInt32BE(20);
  const profundidade = b[24];
  const tipo = b[25];
  const entrelacado = b[28];

  if (profundidade !== 8 || entrelacado !== 0 || (tipo !== 6 && tipo !== 2)) {
    throw new Error(`${caminho}: só suporto RGB/RGBA de 8 bits sem entrelaçamento`);
  }
  const canais = tipo === 6 ? 4 : 3;

  // Junta todos os IDAT antes de inflar — PNG grande vem fatiado.
  const pedacos = [];
  let i = 8;
  while (i < b.length) {
    const tam = b.readUInt32BE(i);
    const nome = b.toString("ascii", i + 4, i + 8);
    if (nome === "IDAT") pedacos.push(b.subarray(i + 8, i + 8 + tam));
    if (nome === "IEND") break;
    i += 12 + tam;
  }

  const bruto = inflateSync(Buffer.concat(pedacos));
  const passo = largura * canais;
  const px = Buffer.alloc(largura * altura * 4);

  // Desfaz os filtros por linha (PNG guarda diferenças, não valores).
  const anterior = Buffer.alloc(passo);
  const atual = Buffer.alloc(passo);
  let off = 0;

  for (let y = 0; y < altura; y++) {
    const filtro = bruto[off++];
    bruto.copy(atual, 0, off, off + passo);
    off += passo;

    for (let x = 0; x < passo; x++) {
      const a = x >= canais ? atual[x - canais] : 0;
      const c = x >= canais ? anterior[x - canais] : 0;
      const bAcima = anterior[x];
      let v = atual[x];
      switch (filtro) {
        case 1: v += a; break;
        case 2: v += bAcima; break;
        case 3: v += (a + bAcima) >> 1; break;
        case 4: {
          const p = a + bAcima - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - bAcima);
          const pc = Math.abs(p - c);
          v += pa <= pb && pa <= pc ? a : pb <= pc ? bAcima : c;
          break;
        }
      }
      atual[x] = v & 0xff;
    }
    atual.copy(anterior);

    for (let x = 0; x < largura; x++) {
      const s = x * canais;
      const d = (y * largura + x) * 4;
      px[d] = atual[s];
      px[d + 1] = atual[s + 1];
      px[d + 2] = atual[s + 2];
      px[d + 3] = canais === 4 ? atual[s + 3] : 255;
    }
  }

  return { largura, altura, px };
}

/* ------------------------------- codificar ------------------------------- */

function pedaco(tipo, dados) {
  const tam = Buffer.alloc(4);
  tam.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tam, corpo, crc]);
}

function escreverPng(largura, altura, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const linhas = Buffer.alloc((largura * 4 + 1) * altura);
  for (let y = 0; y < altura; y++) {
    const d = y * (largura * 4 + 1);
    linhas[d] = 0;
    rgba.copy(linhas, d + 1, y * largura * 4, (y + 1) * largura * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco("IHDR", ihdr),
    pedaco("IDAT", deflateSync(linhas, { level: 9 })),
    pedaco("IEND", Buffer.alloc(0)),
  ]);
}

/* -------------------------------- reamostra ------------------------------ */

/** Média de área: cada pixel de destino é a média do bloco de origem. */
function reduzir(img, destino) {
  const { largura: lo, altura: ao, px } = img;
  const saidaPx = Buffer.alloc(destino * destino * 4);
  const escala = lo / destino;

  for (let y = 0; y < destino; y++) {
    const y0 = Math.floor(y * escala);
    const y1 = Math.min(ao, Math.max(y0 + 1, Math.ceil((y + 1) * escala)));
    for (let x = 0; x < destino; x++) {
      const x0 = Math.floor(x * escala);
      const x1 = Math.min(lo, Math.max(x0 + 1, Math.ceil((x + 1) * escala)));

      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * lo + sx) * 4;
          const al = px[i + 3] / 255;
          // Média com alfa pré-multiplicado, senão borda transparente suja a cor.
          r += px[i] * al;
          g += px[i + 1] * al;
          b += px[i + 2] * al;
          a += px[i + 3];
          n++;
        }
      }
      const d = (y * destino + x) * 4;
      const aMedio = a / n;
      const peso = aMedio > 0 ? n * (aMedio / 255) : 1;
      saidaPx[d] = Math.round(r / peso);
      saidaPx[d + 1] = Math.round(g / peso);
      saidaPx[d + 2] = Math.round(b / peso);
      saidaPx[d + 3] = Math.round(aMedio);
    }
  }
  return { largura: destino, altura: destino, px: saidaPx };
}

/** Achata sobre uma cor sólida (ícone de PWA não pode ter transparência). */
function sobreFundo(img, cor) {
  const { largura, altura, px } = img;
  const saidaPx = Buffer.alloc(largura * altura * 4);
  for (let i = 0; i < largura * altura; i++) {
    const d = i * 4;
    const a = px[d + 3] / 255;
    for (let c = 0; c < 3; c++) saidaPx[d + c] = Math.round(px[d + c] * a + cor[c] * (1 - a));
    saidaPx[d + 3] = 255;
  }
  return { largura, altura, px: saidaPx };
}

/** Centraliza uma imagem menor numa tela maior — usado na zona segura do maskable. */
function centralizar(img, tela, cor) {
  const px = Buffer.alloc(tela * tela * 4);
  for (let i = 0; i < tela * tela; i++) {
    const d = i * 4;
    px[d] = cor[0];
    px[d + 1] = cor[1];
    px[d + 2] = cor[2];
    px[d + 3] = 255;
  }
  const off = Math.round((tela - img.largura) / 2);
  for (let y = 0; y < img.altura; y++) {
    for (let x = 0; x < img.largura; x++) {
      const s = (y * img.largura + x) * 4;
      const d = ((y + off) * tela + (x + off)) * 4;
      const a = img.px[s + 3] / 255;
      for (let c = 0; c < 3; c++) px[d + c] = Math.round(img.px[s + c] * a + px[d + c] * (1 - a));
      px[d + 3] = 255;
    }
  }
  return { largura: tela, altura: tela, px };
}

/* --------------------------------- gerar --------------------------------- */

const appIcon = lerPng(join(marca, "app-icon-onyx-1024.png"));
const zSozinho = lerPng(join(marca, "icone-dourado-1024.png"));

const arquivos = [];

for (const t of [192, 512]) {
  arquivos.push([`icone-${t}.png`, sobreFundo(reduzir(appIcon, t), ONYX)]);
}
arquivos.push(["apple-touch-icon.png", sobreFundo(reduzir(appIcon, 180), ONYX)]);

// Maskable: o Android recorta as bordas, então o Z fica em ~60% do quadro.
arquivos.push(["mascara-512.png", centralizar(reduzir(zSozinho, 308), 512, ONYX)]);

// Badge da notificação: o iOS/Android renderiza como silhueta.
arquivos.push(["badge.png", sobreFundo(reduzir(zSozinho, 96), ONYX)]);

for (const [nome, img] of arquivos) {
  const dados = escreverPng(img.largura, img.altura, img.px);
  writeFileSync(join(saida, nome), dados);
  console.log(`  ${nome.padEnd(22)} ${img.largura}x${img.altura}  ${(dados.length / 1024).toFixed(1)} KB`);
}

console.log("\nÍcones gerados de public/marca (ZXP Solutions).");
