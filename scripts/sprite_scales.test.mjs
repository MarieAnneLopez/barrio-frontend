// @vitest-environment node
// Verifica la salida real de build_sprite_scales.mjs (sprites32): cada secuencia de Mini Marie es un
// ciclo de 32 cuadros en un atlas de 8 × 4, en sus tamaños fijos (D86, «escala entera») y con celdas
// de ancho entero. Los cuadros que dibujó Marie están en su sitio, intactos, y los intermedios solo
// usan colores de esos cuadros, con alfa binaria (sin halos ni colores nuevos).
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scales = JSON.parse(readFileSync(join(root, 'src/components/avatar/spriteScales.json'), 'utf8'));
const cases = Object.entries(scales).flatMap(([name, spec]) => spec.sizes.map((size) => [name, size, spec]));
const file = (name, size) => join(root, 'public/assets/avatar', name, `${name}_${size}.webp`);
const raw = async (input) => sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

/** Cuadro n del ciclo maestro (scripts/sprite-cycles), en RGBA crudo. */
async function cycleFrame(name, n) {
  const { grid: [cols], cell: [w, h] } = scales[name];
  const left = (n % cols) * w;
  const top = Math.floor(n / cols) * h;
  const path = join(root, 'scripts/sprite-cycles', `${name}_ciclo.webp`);
  return (await raw(await sharp(path).extract({ left, top, width: w, height: h }).png().toBuffer())).data;
}

/** Cuadro dibujado i, con alfa binaria (opaco desde 128), abajo a la izquierda de la celda. */
async function drawnFrame(name, i) {
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
      if (data[from + 3] < 128) continue;
      out.set([data[from], data[from + 1], data[from + 2], 255], ((h - info.height + y) * w + x) * 4);
    }
  }
  return out;
}

describe('ciclos de 32 cuadros de Mini Marie (sprites32)', () => {
  it('cada secuencia tiene su tamaño base, el doble y el cuádruple que existan en el dibujo', () => {
    expect(Object.fromEntries(Object.entries(scales).map(([name, spec]) => [name, spec.sizes]))).toEqual({
      wave: [80, 160, 320, 640], run: [105, 210, 420], sit: [48, 96, 192], idle: [140, 280, 560],
    });
  });

  it.each(Object.entries(scales))('%s: 32 cuadros en 8 × 4 y sus cuadros dibujados en orden', (_name, spec) => {
    expect([spec.frames, spec.grid]).toEqual([32, [8, 4]]);
    expect(spec.keys[0]).toBe(0);
    expect(spec.keys.every((k, i) => i === 0 || k > spec.keys[i - 1])).toBe(true);
    expect(spec.keys.at(-1)).toBeLessThan(32);
  });

  it.each(Object.keys(scales))('%s: los cuadros dibujados van intactos y los intermedios con su paleta', async (name) => {
    const { keys } = scales[name];
    const palette = new Set();
    for (const [i, n] of keys.entries()) {
      const drawn = await drawnFrame(name, i);
      expect((await cycleFrame(name, n)).equals(drawn), `${name}: cuadro ${n}`).toBe(true);
      for (let p = 0; p < drawn.length; p += 4) if (drawn[p + 3]) palette.add(drawn.readUIntBE(p, 3));
    }
    for (let n = 0; n < 32; n += 1) {
      const data = await cycleFrame(name, n);
      let foreign = 0;
      for (let p = 0; p < data.length; p += 4) {
        if (data[p + 3] !== 0 && data[p + 3] !== 255) foreign += 1;
        else if (data[p + 3] && !palette.has(data.readUIntBE(p, 3))) foreign += 1;
      }
      expect(foreign, `${name}: cuadro ${n}`).toBe(0);
    }
  }, 120_000);

  it.each(cases)('%s a %i px: atlas de 8 × 4 con celdas de ancho entero', async (name, size, spec) => {
    const cell = (spec.cell[0] * size) / spec.cell[1];
    expect(Number.isInteger(cell) && Number.isInteger((spec.box[0] * size) / spec.box[1])).toBe(true);
    expect(existsSync(file(name, size)), file(name, size)).toBe(true);
    const meta = await sharp(file(name, size)).metadata();
    expect([meta.width, meta.height]).toEqual([spec.grid[0] * cell, spec.grid[1] * size]);
    expect(meta.hasAlpha).toBe(true);
  });

  // Medido (sprites32): 32 cuadros pesan de 3 a 4 veces lo que las tiras de 7 u 8 (el reposo, que era
  // un solo cuadro, unas 25 veces); el tope deja un 10 % de holgura sobre lo medido.
  const BUDGET_KB = { 48: 40, 80: 90, 96: 90, 105: 120, 140: 140, 160: 200, 192: 180, 210: 260, 280: 340, 320: 470, 420: 460, 560: 740, 640: 840 };
  it.each(cases)('%s a %i px: no pesa de más', (name, size) => {
    const budgetKb = BUDGET_KB[size];
    expect(statSync(file(name, size)).size / 1024).toBeLessThanOrEqual(budgetKb);
  });
});
