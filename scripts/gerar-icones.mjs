/**
 * Gera os PNGs do app sem depender de nenhuma biblioteca de imagem.
 *
 * O desenho é um anel de progresso (a sequência que não pode zerar) com um
 * ponto luminoso na ponta, sobre fundo escuro. Renderizado com supersampling
 * 3x para ficar liso, e codificado em PNG na mão com zlib do próprio Node.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const saida = join(aqui, "..", "public", "icons");
mkdirSync(saida, { recursive: true });

/* --------------------------- codificador PNG ---------------------------- */

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

function pedaco(tipo, dados) {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}

function png(largura, altura, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 6; // RGBA
  const linhas = Buffer.alloc((largura * 4 + 1) * altura);
  for (let y = 0; y < altura; y++) {
    const destino = y * (largura * 4 + 1);
    linhas[destino] = 0; // filtro "none"
    rgba.copy(linhas, destino + 1, y * largura * 4, (y + 1) * largura * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco("IHDR", ihdr),
    pedaco("IDAT", deflateSync(linhas, { level: 9 })),
    pedaco("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------- desenho -------------------------------- */

const misturar = (a, b, t) => a + (b - a) * t;

/** Cor do pixel em coordenadas normalizadas (0..1), em RGB 0..255. */
function amostra(x, y, opcoes) {
  const { anelExterno, anelInterno, sangria } = opcoes;
  const dx = x - 0.5;
  const dy = y - 0.5;
  const r = Math.hypot(dx, dy);

  // Fundo: preto ZXP com um brilho dourado vindo do topo.
  const brilho = Math.max(0, 1 - Math.hypot(dx, y - 0.05) * 1.5);
  let cor = [
    misturar(12, 58, brilho * 0.5),
    misturar(13, 47, brilho * 0.5),
    misturar(16, 14, brilho * 0.5),
  ];

  if (sangria && r > 0.62) return cor; // maskable: fora da zona segura fica só o fundo

  // Trilho do anel (a parte "ainda não conquistada").
  if (r >= anelInterno && r <= anelExterno) {
    cor = [misturar(cor[0], 41, 0.92), misturar(cor[1], 45, 0.92), misturar(cor[2], 53, 0.92)];
  }

  // Arco de progresso: começa no topo e varre 78% do círculo no sentido horário.
  const angulo = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2);
  const varrida = Math.PI * 2 * 0.78;
  if (r >= anelInterno && r <= anelExterno && angulo <= varrida) {
    const t = angulo / varrida;
    // ouro escuro -> amarelo da marca -> amarelo claro ao longo do arco
    const paleta =
      t < 0.5
        ? [misturar(201, 247, t * 2), misturar(151, 196, t * 2), misturar(0, 28, t * 2)]
        : [misturar(247, 255, (t - 0.5) * 2), misturar(196, 227, (t - 0.5) * 2), misturar(28, 122, (t - 0.5) * 2)];
    cor = paleta;
  }

  // Ponto brilhante na ponta do arco.
  const meio = (anelInterno + anelExterno) / 2;
  const px = 0.5 + Math.sin(varrida) * meio;
  const py = 0.5 - Math.cos(varrida) * meio;
  const dPonto = Math.hypot(x - px, y - py);
  const raioPonto = (anelExterno - anelInterno) * 0.92;
  if (dPonto <= raioPonto) {
    const t = Math.min(1, dPonto / raioPonto);
    cor = [misturar(255, cor[0], t ** 2), misturar(255, cor[1], t ** 2), misturar(252, cor[2], t ** 2)];
  }

  // Núcleo: um ponto sólido no centro, o "agora".
  if (r <= anelInterno * 0.3) {
    cor = [242, 244, 248];
  }

  return cor;
}

function desenhar(tamanho, { sangria = false } = {}) {
  const AA = 3;
  const buf = Buffer.alloc(tamanho * tamanho * 4);
  const opcoes = sangria
    ? { anelExterno: 0.33, anelInterno: 0.255, sangria: true }
    : { anelExterno: 0.4, anelInterno: 0.31, sangria: false };

  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < AA; sy++) {
        for (let sx = 0; sx < AA; sx++) {
          const c = amostra(
            (x + (sx + 0.5) / AA) / tamanho,
            (y + (sy + 0.5) / AA) / tamanho,
            opcoes
          );
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      const n = AA * AA;
      const i = (y * tamanho + x) * 4;
      buf[i] = Math.round(r / n);
      buf[i + 1] = Math.round(g / n);
      buf[i + 2] = Math.round(b / n);
      buf[i + 3] = 255;
    }
  }
  return png(tamanho, tamanho, buf);
}

const arquivos = [
  ["icone-192.png", desenhar(192)],
  ["icone-512.png", desenhar(512)],
  ["apple-touch-icon.png", desenhar(180)],
  ["mascara-512.png", desenhar(512, { sangria: true })],
  ["badge.png", desenhar(96)],
];

for (const [nome, dados] of arquivos) {
  writeFileSync(join(saida, nome), dados);
  console.log(`  ${nome.padEnd(22)} ${(dados.length / 1024).toFixed(1)} KB`);
}
console.log("\nÍcones gerados em public/icons.");
