// @vitest-environment node
// Ciclos de las hojas de 32 cuadros de Martín (D124; scripts/sprite32): carrera, saludo y sentada.
// Todo cuadro sale de la hoja (no hay intermedios): alfa binaria, solo colores de la paleta de su
// hoja (incluidos el rojo de los corazones y el amarillo de las chispas), sin restos sueltos del
// clave y, puesto sobre crema, rosa claro, rosa y negro, ni un píxel magenta ni un halo en el borde.
import { describe, expect, it } from 'vitest';
import { isMagentaFamily } from './sprite/color.mjs';
import { isSpill } from './sprite/frame.mjs';
import { loadPalette } from './sprite/snap.mjs';
import { defects, readCycle, root, scales } from './sprite_cycles_lib.mjs';

const sheets = Object.keys(scales).filter((name) => scales[name].sheet);
const BACKS = { crema: [0xfc, 0xf0, 0xcf], rosaClaro: [0xf3, 0xd1, 0xdc], rosa: [0xf6, 0xa7, 0xc1], negro: [0, 0, 0] };
// Las chispas y los corazones del saludo son trozos sueltos del dibujo (cuadros 11–24 de la hoja).
const SPARKS = { wave: [10, 23] };
// La sentada trae huecos de fondo de la hoja entre la pierna alzada y la bota (medidos: hasta 3).
const MAX_HOLES = { run: 0, wave: 0, sit: 3 };

describe('ciclos de las hojas de 32 cuadros de Martín (D124)', () => {
  it('son la carrera, el saludo y la sentada, de 32 cuadros', () => {
    expect(sheets.sort()).toEqual(['run', 'sit', 'wave']);
    for (const name of sheets) expect(scales[name].frames).toBe(32);
  });

  it.each(sheets)('%s: alfa binaria y solo colores de la paleta de su hoja', async (name) => {
    const palette = new Set(loadPalette(root, name).map(([r, g, b]) => (r << 16) | (g << 8) | b));
    const { frames } = await readCycle(name);
    frames.forEach((data, n) => {
      let foreign = 0;
      for (let p = 0; p < data.length; p += 4) {
        if (data[p + 3] !== 0 && data[p + 3] !== 255) foreign += 1;
        else if (data[p + 3] && !palette.has(data.readUIntBE(p, 3))) foreign += 1;
      }
      expect(foreign, `${name}: cuadro ${n + 1}`).toBe(0);
    });
  }, 120_000);

  it.each(sheets)('%s: sin restos sueltos del clave ni huecos de más', async (name) => {
    const { frames, w, h } = await readCycle(name);
    const [from, to] = SPARKS[name] ?? [Infinity, -Infinity];
    frames.forEach((frame, n) => {
      const { holes, specks } = defects(frame, w, h);
      expect(holes.length, `${name}: cuadro ${n + 1}, huecos ${holes}`).toBeLessThanOrEqual(MAX_HOLES[name]);
      if (n < from || n > to) expect(specks, `${name}: cuadro ${n + 1}`).toEqual([]);
    });
  }, 120_000);

  it.each(sheets)('%s: sobre crema, rosa claro, rosa y negro no queda magenta ni halo', async (name) => {
    const { frames, w, h } = await readCycle(name);
    const found = [];
    const opaque = (f, x, y) => x >= 0 && y >= 0 && x < w && y < h && f[(y * w + x) * 4 + 3] === 255;
    frames.forEach((f, n) => {
      for (const [back, rgb] of Object.entries(BACKS)) {
        let [magenta, halo] = [0, 0];
        for (let y = 0; y < h; y += 1) {
          for (let x = 0; x < w; x += 1) {
            const p = (y * w + x) * 4;
            const color = f[p + 3] ? [f[p], f[p + 1], f[p + 2]] : rgb;
            if (isMagentaFamily(color)) magenta += 1;
            const edge = f[p + 3] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !opaque(f, x + dx, y + dy));
            if (edge && isSpill(color)) halo += 1;
          }
        }
        if (magenta || halo) found.push(`${name} ${n + 1} sobre ${back}: ${magenta} magenta, ${halo} halo`);
      }
    });
    expect(found).toEqual([]);
  }, 240_000);
});
