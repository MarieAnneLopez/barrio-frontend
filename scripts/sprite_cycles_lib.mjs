// Ciclos maestros de Mini Marie (scripts/sprite-cycles, sprites32) para sus pruebas: lectura de los
// cuadros, de los dibujados por Marie y medidas (huecos y trozos sueltos, pie de la carrera).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { labelComponents } from './sprite/components.mjs';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const scales = JSON.parse(readFileSync(join(root, 'src/components/avatar/spriteScales.json'), 'utf8'));
export const cyclePath = (name) => join(root, 'scripts/sprite-cycles', `${name}_ciclo.webp`);
const raw = (input) => sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

/** Las celdas de un atlas de `cols` columnas, de w × h, en RGBA crudo. */
export function cellsOf({ data, info }, cols, w, h, count) {
  return Array.from({ length: count }, (_, n) => {
    const out = Buffer.alloc(w * h * 4);
    const [left, top] = [(n % cols) * w, Math.floor(n / cols) * h];
    for (let y = 0; y < h; y += 1) {
      const from = ((top + y) * info.width + left) * 4;
      data.copy(out, y * w * 4, from, from + w * 4);
    }
    return out;
  });
}

/** Los 32 cuadros del ciclo maestro y su celda. */
export async function readCycle(name) {
  const { grid: [cols], cell: [w, h], frames } = scales[name];
  return { frames: cellsOf(await raw(cyclePath(name)), cols, w, h, frames), w, h };
}

/** Cuadro dibujado i, con alfa binaria (opaco desde 128), abajo a la izquierda de la celda. */
export async function drawnFrame(name, i) {
  const { cell: [w, h], source } = scales[name];
  const dir = join(root, 'public/assets/avatar', name);
  let input = join(dir, `${name}_${i + 1}.png`);
  if (!existsSync(input)) {
    const index = [...Array(source.frames).keys()].filter((k) => !source.skip.includes(k))[i];
    const strip = join(dir, `${name}_strip.webp`);
    const { width, height } = await sharp(strip).metadata();
    const sw = width / source.frames;
    input = await sharp(strip).extract({ left: index * sw, top: 0, width: sw, height }).png().toBuffer();
  }
  const { data, info } = await raw(input);
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const from = (y * info.width + x) * 4;
      if (data[from + 3] >= 128) out.set([data[from], data[from + 1], data[from + 2], 255], ((h - info.height + y) * w + x) * 4);
    }
  }
  return out;
}

/** Áreas de los huecos transparentes encerrados y de los trozos opacos sueltos, de hasta `max` px. */
export function defects(frame, w, h, max = 60) {
  const solid = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p += 1) solid[p] = frame[p * 4 + 3] ? 1 : 0;
  const inside = (c) => c.minX > 0 && c.minY > 0 && c.maxX < w - 1 && c.maxY < h - 1;
  const holes = labelComponents(solid.map((v) => 1 - v), w, h).comps.filter((c) => c.area <= max && inside(c));
  const parts = labelComponents(solid, w, h, { diagonal: true }).comps.map((c) => c.area).sort((a, b) => b - a);
  return { holes: holes.map((c) => c.area), specks: parts.slice(1).filter((a) => a <= max) };
}

/** Pie del cuadro: su fila opaca más baja y la x media de los píxeles opacos de sus 6 filas más bajas. */
export function foot(frame, w, h) {
  let y = h - 1;
  const opaqueRow = (row) => [...Array(w).keys()].filter((x) => frame[(row * w + x) * 4 + 3]);
  while (y > 0 && opaqueRow(y).length === 0) y -= 1;
  const xs = [y - 5, y - 4, y - 3, y - 2, y - 1, y].flatMap(opaqueRow);
  return { y, x: xs.reduce((s, x) => s + x, 0) / xs.length };
}
