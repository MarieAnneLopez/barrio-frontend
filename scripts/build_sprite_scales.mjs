#!/usr/bin/env node
// Tamaños fijos de Mini Marie (D86, «escala entera»). Sus dibujos no siguen una rejilla de píxel
// regular, así que cada secuencia se genera una sola vez en sus tamaños de uso, con celdas de
// ancho entero, para mostrarla 1:1 (o 2:1 exacto en pantallas 2×) con image-rendering: pixelated.
// Lee los cuadros ya recortados de public/assets/avatar (copias): nunca "MINI MARIE.png".
// Uso: node scripts/build_sprite_scales.mjs
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const avatar = join(root, 'public', 'assets', 'avatar');
const scales = JSON.parse(readFileSync(join(root, 'src', 'components', 'avatar', 'spriteScales.json'), 'utf8'));
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

/** Cuadro i (desde 0) de una secuencia: su PNG si existe; si no, el recorte de la tira. */
async function frame(name, i, frames) {
  const png = join(avatar, name, `${name}_${i + 1}.png`);
  if (existsSync(png)) return sharp(png).png().toBuffer();
  const strip = sharp(join(avatar, name, `${name}_strip.webp`));
  const { width, height } = await strip.metadata();
  const w = width / frames;
  return strip.extract({ left: i * w, top: 0, width: w, height }).png().toBuffer();
}

for (const [name, { frames, cell, sizes }] of Object.entries(scales)) {
  const [cellW, cellH] = cell;
  const cells = [];
  for (let i = 0; i < frames; i++) {
    const source = await frame(name, i, frames);
    const meta = await sharp(source).metadata();
    // La celda se completa con transparente (wave: 327 → 328 px de ancho) para que sea divisible.
    cells.push(await sharp({ create: { width: cellW, height: cellH, channels: 4, background: CLEAR } })
      .composite([{ input: source, left: 0, top: cellH - meta.height }]).png().toBuffer());
  }
  for (const size of sizes) {
    const w = (cellW * size) / cellH;
    const parts = [];
    for (const [i, full] of cells.entries()) {
      const input = size === cellH ? full : await sharp(full).resize(w, size, { kernel: 'lanczos3' }).png().toBuffer();
      parts.push({ input, left: i * w, top: 0 });
    }
    await sharp({ create: { width: w * frames, height: size, channels: 4, background: CLEAR } })
      .composite(parts).webp({ lossless: true }).toFile(join(avatar, name, `${name}_${size}.webp`));
    console.log(`${name}_${size}.webp: ${frames} cuadros de ${w}×${size}`);
  }
}
