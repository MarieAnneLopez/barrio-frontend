// Vuelta a la paleta de la hoja (sprites32, D124): tras reducir un cuadro con lanczos, cada píxel
// con alfa >= 128 queda opaco y con el color de la paleta más cercano; el resto, transparente. Así
// los atlas de las hojas de 32 cuadros de Martín no traen bordes borrosos ni tonos que no estén en
// su hoja. La paleta la escribe scripts/sprite32/build.py en scripts/sprite-cycles/<nombre>_paleta.json.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Paleta [[r, g, b], …] de la hoja de esa secuencia. */
export function loadPalette(root, name) {
  return JSON.parse(readFileSync(join(root, 'scripts', 'sprite-cycles', `${name}_paleta.json`), 'utf8'));
}

/** Índice del color de la paleta más cercano (distancia euclídea), con caché por color. */
function nearestOf(palette) {
  const cache = new Map();
  return (r, g, b) => {
    const key = (r << 16) | (g << 8) | b;
    let best = cache.get(key);
    if (best !== undefined) return best;
    let min = Infinity;
    palette.forEach(([pr, pg, pb], i) => {
      const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
      if (d < min) [min, best] = [d, i];
    });
    cache.set(key, best);
    return best;
  };
}

/** RGBA crudo → RGBA crudo con alfa binaria y solo colores de la paleta. */
export function snapRgba(data, palette) {
  const nearest = nearestOf(palette);
  const out = Buffer.alloc(data.length);
  for (let p = 0; p < data.length; p += 4) {
    if (data[p + 3] < 128) continue;
    const [r, g, b] = palette[nearest(data[p], data[p + 1], data[p + 2])];
    out[p] = r;
    out[p + 1] = g;
    out[p + 2] = b;
    out[p + 3] = 255;
  }
  return out;
}
