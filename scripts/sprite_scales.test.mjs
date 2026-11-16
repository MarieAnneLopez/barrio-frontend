// @vitest-environment node
// Verifica la salida real de build_sprite_scales.mjs: cada secuencia de Mini Marie existe en sus
// tamaños fijos (D86, «escala entera») y cada celda mide un número entero de píxeles de ancho.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scales = JSON.parse(readFileSync(join(root, 'src/components/avatar/spriteScales.json'), 'utf8'));
const cases = Object.entries(scales).flatMap(([name, spec]) => spec.sizes.map((size) => [name, size, spec]));

describe('tamaños fijos de Mini Marie (D86)', () => {
  it.each(cases)('%s a %i px: tira con celdas de ancho entero', async (name, size, spec) => {
    const cell = (spec.cell[0] * size) / spec.cell[1];
    expect(Number.isInteger(cell)).toBe(true);
    const file = join(root, 'public/assets/avatar', name, `${name}_${size}.webp`);
    expect(existsSync(file), file).toBe(true);
    const meta = await sharp(file).metadata();
    expect([meta.width, meta.height]).toEqual([spec.frames * cell, size]);
    expect(meta.hasAlpha).toBe(true);
  });
});
