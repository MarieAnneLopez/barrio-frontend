#!/usr/bin/env node
// Logo y favicon (D82, D84, D86): el rostro sonriente de Mini Marie, recortado del cuadro 6 del
// saludo que dibujó Marie, sin cambiar su estilo ni su expresión. Lee la copia ya recortada de
// public/assets/avatar: nunca "MINI MARIE.png".
// - Logo: solo el rostro con transparencia, a 32 y 48 px y sus múltiplos exactos (64 y 96 px)
//   para pantallas densas; el círculo lo pone el CSS.
// - Favicon: el mismo rostro sobre un círculo papel con aro acero (paleta D84), sin CSS.
// Uso: node scripts/build_brand_assets.mjs
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const brand = join(pub, 'assets', 'brand');
const CROP = { left: 24, top: 0, width: 272, height: 272 }; // cabeza y hombros del cuadro 6
const [PAPEL, ACERO] = ['#e8d8c9', '#4b607f'];
const PNG = { compressionLevel: 9 };

mkdirSync(brand, { recursive: true });
const face = await sharp(join(pub, 'assets', 'avatar', 'wave', 'wave_6.png')).extract(CROP).png().toBuffer();

for (const size of [32, 48, 64, 96]) {
  await sharp(face).resize(size, size, { kernel: 'lanczos3' }).png(PNG).toFile(join(brand, `marie-logo-${size}.png`));
  console.log(`marie-logo-${size}.png`);
}

const svg = (size, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${body}</svg>`);

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
