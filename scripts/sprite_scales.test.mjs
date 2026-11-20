// @vitest-environment node
// Verifica la salida real de build_sprite_scales.mjs (sprites32): cada secuencia de Mini Marie es un
// atlas de 32 cuadros en 8 × 4, en sus tamaños fijos (D86, «escala entera»), con celdas de ancho
// entero, hecho con el ciclo maestro de hoy y sin pasarse de peso. Los ciclos maestros (cuadros
// dibujados intactos, paleta, huecos, pie de la carrera) se prueban en sprite_cycles.test.mjs.
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { loadPalette, snapRgba } from './sprite/snap.mjs';
import { cellsOf, readCycle, root, scales } from './sprite_cycles_lib.mjs';

const cases = Object.entries(scales).flatMap(([name, spec]) => spec.sizes.map((size) => [name, size, spec]));
const file = (name, size) => join(root, 'public/assets/avatar', name, `${name}_${size}.webp`);

/** Parte de los píxeles que se apartan más de `t` niveles (color premultiplicado o alfa). */
function offShare(a, b, t) {
  let off = 0;
  for (let p = 0; p < a.length; p += 4) {
    let e = Math.abs(a[p + 3] - b[p + 3]);
    for (let c = 0; c < 3; c += 1) e = Math.max(e, Math.abs(a[p + c] * a[p + 3] - b[p + c] * b[p + 3]) / 255);
    if (e > t) off += 1;
  }
  return off / (a.length / 4);
}

/** Píxeles que se ven distintos (dos transparentes son iguales aunque difiera el color guardado). */
function visibleDiff(a, b) {
  let off = 0;
  for (let p = 0; p < a.length; p += 4) if ((a[p + 3] || b[p + 3]) && a.readUInt32BE(p) !== b.readUInt32BE(p)) off += 1;
  return off;
}

describe('atlas de Mini Marie (sprites32)', () => {
  it('cada secuencia tiene su tamaño base, el doble y el cuádruple que existan en el dibujo', () => {
    expect(Object.fromEntries(Object.entries(scales).map(([name, spec]) => [name, spec.sizes]))).toEqual({
      wave: [80, 96, 160, 192, 320, 384, 640], run: [105, 120, 210, 240, 420], sit: [48, 96, 192], idle: [140, 280, 560],
    });
  });

  it.each(Object.entries(scales))('%s: 32 cuadros en 8 × 4 y sus cuadros dibujados en orden', (_name, spec) => {
    expect([spec.frames, spec.grid]).toEqual([32, [8, 4]]);
    expect(spec.keys[0]).toBe(0);
    expect(spec.keys.every((k, i) => i === 0 || k > spec.keys[i - 1])).toBe(true);
    expect(spec.keys.at(-1)).toBeLessThan(32);
  });

  it.each(cases)('%s a %i px: atlas de 8 × 4 con celdas de ancho entero', async (name, size, spec) => {
    const cell = Math.round((spec.cell[0] * size) / spec.cell[1]);
    expect(Number.isInteger(cell) && Number.isInteger((spec.box[0] * size) / spec.box[1])).toBe(true);
    expect(existsSync(file(name, size)), file(name, size)).toBe(true);
    const meta = await sharp(file(name, size)).metadata();
    expect([meta.width, meta.height]).toEqual([spec.grid[0] * cell, spec.grid[1] * size]);
    expect(meta.hasAlpha).toBe(true);
  });

  // Revisión de sprites32: nada comprobaba que el atlas saliera del ciclo maestro de hoy. Cada celda
  // es su cuadro reducido como en build_sprite_scales.mjs (lanczos3); la compresión con pérdida
  // aparta a lo sumo un 0,1 % de los píxeles más de 64 niveles (medido); un maestro cambiado sin
  // rehacer el atlas, en torno al 16 % (la carrera con las piernas nuevas). Las hojas de Martín (D124)
  // van además a la paleta de su hoja con alfa binaria, igual que en el build.
  it.each(cases)('%s a %i px: cada celda es su cuadro del ciclo maestro de hoy', async (name, size, spec) => {
    const { frames, w, h } = await readCycle(name);
    const cw = Math.round((w * size) / h);
    const decoded = await sharp(file(name, size)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const cells = cellsOf(decoded, spec.grid[0], cw, size, frames.length);
    for (const [n, frame] of frames.entries()) {
      let want = size === h ? frame : await sharp(frame, { raw: { width: w, height: h, channels: 4 } })
        .resize(cw, size, { kernel: 'lanczos3' }).raw().toBuffer();
      if (spec.sheet && size !== h) want = snapRgba(want, loadPalette(root, name)); // D124: vuelta a la paleta
      expect(offShare(cells[n], want, 64), `${name}_${size}: celda ${n}`).toBeLessThanOrEqual(0.005);
    }
  }, 120_000);

  // Revisión de sprites32: el reposo repite cuadros (sostenidos) y la compresión con pérdida los
  // hacía distintos entre sí: «respiraba» con ruido. Va sin pérdida: lo idéntico queda idéntico en
  // todo píxel visible (WebP sin pérdida reescribe el color bajo alfa 0, que no se pinta).
  it.each(cases.filter(([name]) => name === 'idle'))('%s a %i px: los cuadros repetidos son idénticos', async (name, size, spec) => {
    const { frames } = await readCycle(name);
    const decoded = await sharp(file(name, size)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const cells = cellsOf(decoded, spec.grid[0], decoded.info.width / spec.grid[0], size, frames.length);
    const pairs = frames.flatMap((f, n) => frames.slice(n + 1).flatMap((g, k) => (f.equals(g) ? [[n, n + 1 + k]] : [])));
    expect(pairs.length).toBeGreaterThan(0);
    for (const [n, m] of pairs) expect(visibleDiff(cells[n], cells[m]), `${name}_${size}: ${n} y ${m}`).toBe(0);
  }, 120_000);

  // Medido (sprites32): 32 cuadros pesan de 3 a 4 veces lo que las tiras de 7 u 8 (el reposo, que era
  // un solo cuadro, unas 25 veces); el tope deja un 10 % de holgura sobre lo medido.
  const BUDGET_KB = { 120: 135, 240: 315, 384: 580, 48: 40, 80: 90, 96: 90, 105: 120, 140: 200, 160: 200, 192: 180, 210: 260, 280: 340, 320: 470, 420: 460, 560: 740, 640: 840 };
  it.each(cases)('%s a %i px: no pesa de más', (name, size) => {
    const budgetKb = name === 'wave' && size === 192 ? 240 : name === 'wave' && size === 96 ? 106 : BUDGET_KB[size];
    expect(statSync(file(name, size)).size / 1024).toBeLessThanOrEqual(budgetKb);
  });
});
