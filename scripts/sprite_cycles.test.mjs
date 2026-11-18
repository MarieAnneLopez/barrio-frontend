// @vitest-environment node
// Ciclos maestros de Mini Marie (scripts/sprite-cycles; sprites32), de los que salen los atlas. Los
// cuadros que dibujó Marie van intactos y en su sitio; los intermedios solo usan colores de esos
// cuadros, con alfa binaria (sin halos ni colores nuevos), y no traen huecos ni trozos sueltos que
// no tengan sus dibujados vecinos. En la carrera, el pie apoyado no patina con el avance de la
// pantalla de carga (revisión de sprites32).
import { describe, expect, it } from 'vitest';
import { offsetAt } from '../src/components/avatar/loadingRun';
import { defects, drawnFrame, foot, readCycle, scales } from './sprite_cycles_lib.mjs';

const names = Object.keys(scales);
const sum = (xs) => xs.reduce((s, x) => s + x, 0);
const GROUND = 418; // fila del suelo en la celda de la carrera (196 × 420)
const touches = (f) => f.y >= GROUND - 2;
const runFeet = async () => {
  const { frames, w, h } = await readCycle('run');
  return frames.map((f) => foot(f, w, h));
};

describe('ciclos maestros de Mini Marie (sprites32)', () => {
  it.each(names)('%s: los cuadros dibujados van intactos y los intermedios con su paleta', async (name) => {
    const { frames } = await readCycle(name);
    const palette = new Set();
    for (const [i, n] of scales[name].keys.entries()) {
      const drawn = await drawnFrame(name, i);
      expect(frames[n].equals(drawn), `${name}: cuadro ${n}`).toBe(true);
      for (let p = 0; p < drawn.length; p += 4) if (drawn[p + 3]) palette.add(drawn.readUIntBE(p, 3));
    }
    frames.forEach((data, n) => {
      let foreign = 0;
      for (let p = 0; p < data.length; p += 4) {
        if (data[p + 3] !== 0 && data[p + 3] !== 255) foreign += 1;
        else if (data[p + 3] && !palette.has(data.readUIntBE(p, 3))) foreign += 1;
      }
      expect(foreign, `${name}: cuadro ${n}`).toBe(0);
    });
  }, 120_000);

  // Revisión: grietas, agujeros y restos sueltos en los intermedios. Un intermedio puede traer los
  // huecos (y los destellos sueltos del saludo) de sus dibujados vecinos, no más.
  it.each(names)('%s: ningún intermedio trae huecos ni trozos sueltos de más', async (name) => {
    const { frames, w, h } = await readCycle(name);
    const { keys } = scales[name];
    const found = frames.map((f) => defects(f, w, h));
    const extra = [];
    frames.forEach((_, n) => {
      if (keys.includes(n)) return;
      const [prev, next] = [Math.max(...keys.filter((k) => k < n)), keys.find((k) => k > n) ?? keys[0]];
      for (const kind of ['holes', 'specks']) {
        const [mine, near] = [found[n][kind], [...found[prev][kind], ...found[next][kind]]];
        if (mine.length > near.length || sum(mine) > sum(near)) extra.push(`${n} ${kind}: ${mine}`);
      }
    });
    expect(extra).toEqual([]);
  }, 120_000);

  // Revisión: el pie apoyado patinaba (de 4 a 11, de 24 a 27, de 30 a 0; de 22 a 23 retrocedía 17 px).
  // Apoya el cuadro cuya fila opaca más baja llega al suelo; su pie es la x media de sus 6 filas más
  // bajas, y en pantalla se le suma lo que ella ha avanzado (offsetAt, la pantalla de carga).
  it('carrera: entre dos cuadros seguidos que apoyan, el pie no se mueve más de 3 px en pantalla', async () => {
    const feet = await runFeet();
    const pairs = [];
    feet.forEach((a, n) => {
      const b = feet[(n + 1) % 32];
      if (touches(a) && touches(b)) pairs.push([n, b.x + offsetAt(n + 1, 420) - a.x - offsetAt(n, 420)]);
    });
    expect(pairs.length).toBeGreaterThanOrEqual(8); // dos apoyos de 4 cuadros o más
    expect(pairs.filter(([, drift]) => Math.abs(drift) > 3)).toEqual([]);
  }, 60_000);
});
