// @vitest-environment node
// Verifica la salida real de build_sprite_scales.mjs: cada secuencia de Mini Marie existe en sus
// tamaños fijos (D86, «escala entera»), cada celda mide un número entero de píxeles de ancho y
// ninguna tira pesa de más (la de la pantalla de carga se descarga antes que nada).
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scales = JSON.parse(readFileSync(join(root, 'src/components/avatar/spriteScales.json'), 'utf8'));
const cases = Object.entries(scales).flatMap(([name, spec]) => spec.sizes.map((size) => [name, size, spec]));
const file = (name, size) => join(root, 'public/assets/avatar', name, `${name}_${size}.webp`);

describe('tamaños fijos de Mini Marie (D86)', () => {
  it('cada secuencia tiene su tamaño base, el doble y el cuádruple que existan en el dibujo', () => {
    expect(Object.fromEntries(Object.entries(scales).map(([name, spec]) => [name, spec.sizes]))).toEqual({
      wave: [80, 160, 320, 640], run: [210, 420], sit: [48, 96, 192],
    });
  });

  it.each(cases)('%s a %i px: tira con celdas de ancho entero', async (name, size, spec) => {
    const cell = (spec.cell[0] * size) / spec.cell[1];
    expect(Number.isInteger(cell)).toBe(true);
    expect(existsSync(file(name, size)), file(name, size)).toBe(true);
    const meta = await sharp(file(name, size)).metadata();
    expect([meta.width, meta.height]).toEqual([spec.frames * cell, size]);
    expect(meta.hasAlpha).toBe(true);
  });

  // Medido: WebP al 90 % se ve igual que sin pérdida a ×4 de aumento y pesa 3,8 veces menos.
  it.each(cases)('%s a %i px: pesa poco (≤ 160 KB; ≤ 320 KB la de 640 px)', (name, size) => {
    const budgetKb = size > 420 ? 320 : 160;
    expect(statSync(file(name, size)).size / 1024).toBeLessThanOrEqual(budgetKb);
  });
});
