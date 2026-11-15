#!/usr/bin/env node
// H33: recorta las secuencias de Mini Marie que dibujó Marie (copias intactas en
// scripts/sprite/fuentes/) en cuadros con alfa, alineados por la cabeza y con los pies
// en un suelo común; escribe cada cuadro, una tira horizontal y un manifiesto.
// Uso: node scripts/slice_sequences.mjs [carpeta de salida]
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { estimateBackground } from './sprite/color.mjs';
import { cutFrame } from './sprite/frame.mjs';
import { buildMasks, findShadowBand, removeShadow } from './sprite/mask.mjs';
import { columnProfile, findCuts, minimalSeam, regionLabels } from './sprite/seam.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] ?? join(root, 'public', 'assets', 'avatar');
const LABELS_END_Y = 300; // la hoja de carrera trae números 01…08 que terminan en y = 286
const SEQUENCES = [
  { name: 'run', file: 'corriendo.jpeg', figures: 8, keep: [1, 2, 3, 4, 5, 6, 7, 8], height: 420 },
  { name: 'wave', file: 'saludando.jpeg', figures: 7, keep: [1, 2, 3, 4, 5, 6, 7], height: 640 },
];
// height: alto final del cuadro en px (la figura mide ~830 px en la hoja).

/** Centro horizontal de la cabeza y el torso: el 45 % superior de la figura. */
function headCenter(inPose, w, h) {
  let sum = 0;
  let n = 0;
  for (let y = 0; y < Math.round(h * 0.45); y++) {
    for (let x = 0; x < w; x++) if (inPose[y * w + x]) (sum += x), (n += 1);
  }
  return sum / n;
}

async function slice({ name, file, figures, keep, height: HEIGHT }) {
  const src = join(root, 'scripts', 'sprite', 'fuentes', file);
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const bg = estimateBackground(data, W, H);
  const { fg, magenta } = buildMasks(data, W, H, bg);
  const shadow = findShadowBand(fg, magenta, W, H);
  removeShadow(data, fg, W, H, shadow);
  const prof = columnProfile(fg, W, LABELS_END_Y, shadow.minY);
  const drawn = [...prof.keys()].filter((x) => prof[x] > 0);
  const cuts = findCuts(prof, figures - 1, 180, drawn[0] + 150, drawn.at(-1) - 150);
  const seams = cuts.map((c) => minimalSeam(fg, W, c, 70, LABELS_END_Y, H));
  const labels = regionLabels(fg, W, H, seams, LABELS_END_Y);
  const cutsOut = [];
  for (const id of keep) {
    let [minX, maxX, minY, maxY] = [W, -1, H, -1];
    for (let y = LABELS_END_Y; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (labels[y * W + x] !== id) continue;
        minX = Math.min(minX, x), maxX = Math.max(maxX, x), minY = Math.min(minY, y), maxY = Math.max(maxY, y);
      }
    }
    const cut = cutFrame(data, labels, W, H, { ids: [id], minX, maxX, minY, maxY }, bg);
    cutsOut.push({ ...cut, cx: headCenter(cut.inPose, cut.w, cut.h) });
  }
  const left = Math.ceil(Math.max(...cutsOut.map((c) => c.cx)));
  const right = Math.ceil(Math.max(...cutsOut.map((c) => c.w - c.cx)));
  const top = Math.min(...cutsOut.map((c) => c.y));
  const [cellW, cellH] = [left + right, Math.max(...cutsOut.map((c) => c.y + c.h)) - top];
  const scale = HEIGHT / cellH;
  const [outW, outH] = [Math.round(cellW * scale), HEIGHT];
  await mkdir(join(OUT, name), { recursive: true });
  const cells = [];
  for (const [i, c] of cutsOut.entries()) {
    const raw = await sharp(Buffer.from(c.rgba), { raw: { width: c.w, height: c.h, channels: 4 } }).png().toBuffer();
    const placed = await sharp({ create: { width: cellW, height: cellH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: raw, left: Math.round(left - c.cx), top: c.y - top }]).png().toBuffer();
    const cell = await sharp(placed).resize(outW, outH, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toBuffer();
    await writeFile(join(OUT, name, `${name}_${i + 1}.png`), cell);
    cells.push({ input: cell, left: i * outW, top: 0 });
  }
  await sharp({ create: { width: outW * cells.length, height: outH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(cells).webp({ quality: 90, alphaQuality: 100 }).toFile(join(OUT, name, `${name}_strip.webp`));
  const crossed = seams.map((s) => s.crossed);
  console.log(`${name}: ${W}×${H}, fondo rgb(${bg}), suelo y ${shadow.minY}, cortes x ${cuts.join(', ')}, ` +
    `píxeles de dibujo cruzados por costura ${crossed.join(', ')}, cuadro ${outW}×${outH}`);
  return { name, frames: cells.length, width: outW, height: outH, source: file, seamCrossed: crossed };
}

const manifest = [];
for (const seq of SEQUENCES) manifest.push(await slice(seq));
const json = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(join(OUT, 'sequences.json'), json);
// Copia para el código (Vite no importa desde public/), como atlas.json.
if (!process.argv[2]) await writeFile(join(root, 'src', 'components', 'avatar', 'sequences.json'), json);
