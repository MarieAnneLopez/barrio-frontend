// @vitest-environment node
// Ciclos maestros de Mini Marie (scripts/sprite-cycles; sprites32), de los que salen los atlas. Los
// cuadros que dibujó Marie van intactos y en su sitio; los intermedios solo usan colores de esos
// cuadros, con alfa binaria (sin halos ni colores nuevos).
import { describe, expect, it } from 'vitest';
import { drawnFrame, readCycle, scales } from './sprite_cycles_lib.mjs';

const names = Object.keys(scales);

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
});
