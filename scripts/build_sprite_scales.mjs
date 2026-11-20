#!/usr/bin/env node
// Atlas de Mini Marie en sus tamaños fijos (D86, «escala entera»; sprites32). Cada secuencia es un
// ciclo de 32 cuadros (8 columnas × 4 filas) guardado sin pérdida, al tamaño mayor, en
// scripts/sprite-cycles/<nombre>_ciclo.webp: los cuadros que dibujó Marie (intactos) y los
// intermedios generados por piezas o flujo óptico, cuantizados a la paleta de esos cuadros
// (método de cada cuadro en scripts/sprite-cycles/metodos.json). Sus dibujos no siguen una rejilla
// de píxel regular, así que cada tamaño se genera una sola vez, celda a celda (lanczos3 al
// reducir), con celdas de ancho entero, para mostrarlo 1:1 (o 2:1 exacto en pantallas 2×) con
// image-rendering: pixelated. La celda del saludo es más ancha que su caja (392 frente a 328 px a
// 640 de alto): el brazo sale por la derecha al subir y bajar.
// WebP al 90 %: medido, a ×4 de aumento se ve igual que sin pérdida y pesa 3,8 veces menos.
// Nunca lee "MINI MARIE.png" ni los dibujos originales: solo los ciclos ya hechos.
// Hojas de 32 cuadros de Martín (D124; `sheet` en spriteScales.json): cada tamaño menor vuelve a la
// paleta de su hoja con alfa binaria (snap.mjs) y va sin pérdida: ni bordes borrosos ni tonos nuevos.
// Uso: node scripts/build_sprite_scales.mjs
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { loadPalette, snapRgba } from './sprite/snap.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const avatar = join(root, 'public', 'assets', 'avatar');
const cycles = join(root, 'scripts', 'sprite-cycles');
const scales = JSON.parse(readFileSync(join(root, 'src', 'components', 'avatar', 'spriteScales.json'), 'utf8'));
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };
const WEBP = { quality: 90, alphaQuality: 100, effort: 6 }; // sin smartSubsample: deja un filo violeta
// El reposo repite cuadros (sostenidos): sin pérdida, lo idéntico queda idéntico (revisión de sprites32).
const LOSSLESS = { lossless: true, effort: 6 };
const WEBP_BY = { idle: LOSSLESS };
// `node build_sprite_scales.mjs idle` rehace solo esa secuencia; sin argumentos, todas.
const only = process.argv.slice(2);

/** PNG reducido → PNG con alfa binaria y los colores de la paleta de la hoja. */
async function snapPng(png, palette) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return sharp(snapRgba(data, palette), { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

/** Las celdas del ciclo maestro, en orden (fila a fila), como PNG. */
async function cells(name, cols, rows, cellW, cellH) {
  const path = join(cycles, `${name}_ciclo.webp`);
  const { width, height } = await sharp(path).metadata();
  if (width !== cols * cellW || height !== rows * cellH) {
    throw new Error(`${name}: el ciclo mide ${width}×${height}, se esperaba ${cols * cellW}×${rows * cellH}`);
  }
  const out = [];
  for (let n = 0; n < cols * rows; n += 1) {
    const box = { left: (n % cols) * cellW, top: Math.floor(n / cols) * cellH, width: cellW, height: cellH };
    out.push(await sharp(path).extract(box).png().toBuffer());
  }
  return out;
}

for (const [name, { frames, grid, cell, sizes, sheet }] of Object.entries(scales)) {
  if (only.length && !only.includes(name)) continue;
  const [cols, rows] = grid;
  const [cellW, cellH] = cell;
  if (cols * rows !== frames) throw new Error(`${name}: ${cols}×${rows} celdas para ${frames} cuadros`);
  const full = await cells(name, cols, rows, cellW, cellH);
  const palette = sheet ? loadPalette(root, name) : null;
  for (const size of sizes) {
    if (process.env.SPRITE_SIZES && !process.env.SPRITE_SIZES.split(',').includes(String(size))) continue;
    const w = Math.round((cellW * size) / cellH);
    const parts = [];
    for (const [n, input] of full.entries()) {
      let scaled = size === cellH ? input : await sharp(input).resize(w, size, { kernel: 'lanczos3' }).png().toBuffer();
      if (palette && size !== cellH) scaled = await snapPng(scaled, palette);
      parts.push({ input: scaled, left: (n % cols) * w, top: Math.floor(n / cols) * size });
    }
    const out = join(avatar, name, `${name}_${size}.webp`);
    await sharp({ create: { width: cols * w, height: rows * size, channels: 4, background: CLEAR } })
      .composite(parts).webp(sheet ? LOSSLESS : (WEBP_BY[name] ?? WEBP)).toFile(out);
    console.log(`${name}_${size}.webp: ${frames} cuadros de ${w}×${size} en ${cols}×${rows}`);
  }
}
