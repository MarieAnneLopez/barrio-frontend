#!/usr/bin/env node
// Logo y favicon (D82, D84, D86; auditoría MM-04): el rostro sonriente de Mini Marie, sin cambiar su
// estilo. Lee los cuadros ya recortados y los ciclos de sprites32: nunca "MINI MARIE.png".
// - Logo: el ciclo de reposo de 32 cuadros (scripts/sprite-cycles/idle_ciclo.webp, 12 fps) recortado
//   al rostro, en un atlas de 8 × 4 sin pérdida (lo idéntico queda idéntico) a 32 y 48 px y sus
//   múltiplos exactos para pantallas densas (64 y 96 px). El póster (PNG: lo primero que se pinta y lo
//   que queda con movimiento reducido) es su cuadro 0, el que dibujó Marie, idéntico a la primera
//   celda: al pasar del póster al ciclo no se nota el cambio. El círculo lo pone el CSS.
// - Favicon: el rostro del cuadro 6 del saludo sobre un círculo papel con aro acero (paleta D84), sin CSS.
// Uso: node scripts/build_brand_assets.mjs
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const brand = join(pub, 'assets', 'brand');
const CROP = { left: 24, top: 0, width: 272, height: 272 }; // cabeza y hombros del cuadro 6 del saludo
const FACE = { left: 16, top: 0, side: 224 }; // el rostro dentro de cada celda del reposo, centrado
const [PAPEL, ACERO] = ['#e8d8c9', '#4b607f'];
const PNG = { compressionLevel: 9 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };
const scales = JSON.parse(readFileSync(join(root, 'src', 'components', 'avatar', 'spriteScales.json'), 'utf8'));
const { grid: [COLS, ROWS], cell: [CELL_W, CELL_H] } = scales.idle;

mkdirSync(brand, { recursive: true });
const cycle = join(root, 'scripts', 'sprite-cycles', 'idle_ciclo.webp');
const faces = [];
for (let n = 0; n < COLS * ROWS; n += 1) {
  const box = { left: (n % COLS) * CELL_W + FACE.left, top: Math.floor(n / COLS) * CELL_H + FACE.top };
  faces.push(await sharp(cycle).extract({ ...box, width: FACE.side, height: FACE.side }).png().toBuffer());
}

for (const size of [32, 48, 64, 96]) {
  const cells = [];
  for (const face of faces) cells.push(await sharp(face).resize(size, size, { kernel: 'lanczos3' }).png().toBuffer());
  const sheet = await sharp({ create: { width: COLS * size, height: ROWS * size, channels: 4, background: CLEAR } })
    .composite(cells.map((input, n) => ({ input, left: (n % COLS) * size, top: Math.floor(n / COLS) * size })))
    .png().toBuffer();
  await sharp(sheet).webp({ lossless: true, effort: 6 }).toFile(join(brand, `marie-face-${size}.webp`));
  // El póster sale de la misma hoja (su celda 0): mismos píxeles, también en los bordes semitransparentes.
  await sharp(sheet).extract({ left: 0, top: 0, width: size, height: size }).png(PNG).toFile(join(brand, `marie-logo-${size}.png`));
  console.log(`marie-logo-${size}.png y marie-face-${size}.webp: ${faces.length} cuadros de ${size} px`);
}

const svg = (size, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${body}</svg>`);
const face = await sharp(join(pub, 'assets', 'avatar', 'wave', 'wave_6.png')).extract(CROP).png().toBuffer();

for (const size of [32, 48]) {
  const ring = Math.round(size / 32); // línea fina: 1 px a 32 y 2 px a 48
  const half = size / 2;
  const disc = svg(size, `<circle cx="${half}" cy="${half}" r="${half - ring / 2}" fill="${PAPEL}" stroke="${ACERO}" stroke-width="${ring}"/>`);
  const inner = Math.round(size * 0.9);
  const head = await sharp(face).resize(inner, inner, { kernel: 'lanczos3' }).png().toBuffer();
  const mask = svg(inner, `<circle cx="${inner / 2}" cy="${inner / 2}" r="${inner / 2 - ring}" fill="#fff"/>`);
  const clipped = await sharp(head).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const offset = Math.round((size - inner) / 2);
  await sharp(disc).composite([{ input: clipped, left: offset, top: offset + Math.round(size * 0.04) }])
    .png(PNG).toFile(join(pub, `favicon-${size}.png`));
  console.log(`favicon-${size}.png`);
}
