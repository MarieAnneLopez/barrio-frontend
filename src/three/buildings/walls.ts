import type { BuildingSource } from './protocol';
import { pushTriangle, pushVertex, type TileBuffers } from './tileBuffers';
import type { Volume } from './volume';
import { columnsFor } from './windows';

/**
 * Muros del edificio `b`: un cuadrilátero por tramo de cada anillo (exterior y huecos), del arranque
 * al remate del volumen. Los vértices de las esquinas se comparten entre tramos (la normal plana la
 * calcula el shader con derivadas), así que cada anillo de n vértices da 2 (n + 1) vértices.
 * La coordenada de columna se acumula por edificio: su parte entera numera la ventana (semilla del
 * hash) y su parte fraccionaria dice dónde cae el fragmento dentro de la columna.
 * Con los exteriores antihorarios y los huecos horarios en (x, −z) (FORMATO §2), el orden
 * (abajo i, abajo i+1, arriba i+1) deja la cara de afuera mirando hacia afuera (+z en un tramo
 * hacia el este con el interior al norte), también en los patios.
 */
export function writeWalls(t: TileBuffers, s: BuildingSource, b: number, vol: Volume, spacing: number): void {
  let column = 0;
  for (let r = s.edificios[b] ?? 0; r < (s.edificios[b + 1] ?? 0); r++) {
    const [from, to] = [s.anillos[r] ?? 0, s.anillos[r + 1] ?? 0];
    const n = to - from;
    if (n < 3) continue;
    const first = t.v;
    let [px, pz] = [s.xz[2 * from] ?? 0, s.xz[2 * from + 1] ?? 0];
    for (let k = 0; k <= n; k++) {
      const p = from + (k % n);
      const [x, z] = [s.xz[2 * p] ?? 0, s.xz[2 * p + 1] ?? 0];
      column += k === 0 ? 0 : columnsFor(Math.hypot(x - px, z - pz), spacing);
      pushVertex(t, x, vol.bottom, z, b, column, vol.top);
      pushVertex(t, x, vol.top, z, b, column, vol.top);
      [px, pz] = [x, z];
    }
    for (let k = 0; k < n; k++) {
      const [lo, hi] = [first + 2 * k, first + 2 * k + 2]; // abajo en i y en i + 1; arriba es +1
      pushTriangle(t, lo, hi, hi + 1);
      pushTriangle(t, lo, hi + 1, lo + 1);
    }
  }
}
