// @vitest-environment node
// Verifica la salida real de slice_spritesheet.mjs en public/assets/avatar/.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';
import { isMagentaFamily } from './color.mjs';
import { isSpill, nearOutside } from './frame.mjs';

const avatarDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../public/assets/avatar');
const SHEET_SHA256 = '65f8f964fc3c368154b0d52ea33f58d57c6f429b5437298d80b891f56e36d106';
const STATES = ['idle_1', 'idle_2', 'walk_left', 'walk_right', 'wave', 'jump'];

const atlas = JSON.parse(readFileSync(join(avatarDir, 'atlas.json'), 'utf8'));
const decoded = new Map();

beforeAll(async () => {
  for (const frame of atlas.frames) {
    const image = sharp(join(avatarDir, frame.file));
    decoded.set(frame.file, await image.raw().toBuffer({ resolveWithObject: true }));
  }
});

describe('spritesheet de Mini Marie', () => {
  it('avatar_sheet.png es copia intacta de "MINI MARIE.png"', () => {
    const hash = createHash('sha256').update(readFileSync(join(avatarDir, 'avatar_sheet.png')));
    expect(hash.digest('hex')).toBe(SHEET_SHA256);
  });

  it('exporta 6 frames en orden con su estado', () => {
    expect(atlas.frames.map((f) => f.file)).toEqual(STATES.map((_, i) => `frame_${i + 1}.png`));
    expect(atlas.frames.map((f) => f.state)).toEqual(STATES);
  });

  it('las cajas son reales, no 6 columnas iguales', () => {
    const widths = new Set(atlas.frames.map((f) => f.w));
    expect(widths.size).toBeGreaterThan(1);
    const xs = atlas.frames.map((f) => f.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });

  it('cada frame tiene alfa: transparente y opaco', () => {
    for (const frame of atlas.frames) {
      const { data, info } = decoded.get(frame.file);
      expect(info.channels).toBe(4);
      expect([info.width, info.height]).toEqual([frame.w, frame.h]);
      let clear = 0;
      let solid = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 0) clear += 1;
        if (data[i] === 255) solid += 1;
      }
      expect(clear).toBeGreaterThan(0);
      expect(solid).toBeGreaterThan(2000);
    }
  });

  // Fondo/sombra (familia magenta): 0 en todo el frame. Halo visible: 0 en el
  // anillo junto a la transparencia; adentro, el malva de pulseras y manos es dibujo.
  it('no deja píxeles magenta residuales', () => {
    for (const frame of atlas.frames) {
      const { data, info } = decoded.get(frame.file);
      const W = info.width;
      const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < info.height ? data[(y * W + x) * 4 + 3] : 0);
      let background = 0;
      let halo = 0;
      for (let p = 0; p < W * info.height; p++) {
        if (data[p * 4 + 3] === 0) continue;
        const rgb = [data[p * 4], data[p * 4 + 1], data[p * 4 + 2]];
        if (isMagentaFamily(rgb)) background += 1;
        if (isSpill(rgb) && nearOutside(at, p % W, Math.floor(p / W))) halo += 1;
      }
      expect(background, `${frame.file} fondo`).toBe(0);
      expect(halo, `${frame.file} halo`).toBe(0);
    }
  });

  it('las poses 1–5 comparten línea base y jump queda en el aire', () => {
    expect(atlas.groundY).toBeGreaterThanOrEqual(805);
    expect(atlas.groundY).toBeLessThanOrEqual(815);
    for (const frame of atlas.frames.slice(0, 5)) {
      expect(Math.abs(frame.offsetY), frame.file).toBeLessThanOrEqual(3);
    }
    const jump = atlas.frames[5];
    expect(jump.offsetY).toBeGreaterThanOrEqual(35);
    expect(jump.offsetY).toBeLessThanOrEqual(48);
  });

  it('footX cae dentro del frame y footY es el borde inferior de los pies', () => {
    for (const frame of atlas.frames) {
      expect(frame.footX).toBeGreaterThan(0);
      expect(frame.footX).toBeLessThan(frame.w);
      expect(frame.footY).toBeGreaterThan(frame.h * 0.9);
    }
  });
});
