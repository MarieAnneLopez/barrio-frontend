import { BLIND, DROPPED } from './partyWalls';
import type { BuildingSource } from './protocol';
import { pushTriangle, pushVertex, type TileBuffers } from './tileBuffers';
import type { Volume } from './volume';
import { columnsFor } from './windows';

/** Columna de los muros ciegos (medianeras): sin ventanas. */
export const BLIND_COLUMN = -1;

/** Par de vértices (abajo, arriba) en (x, z); devuelve el de abajo (el de arriba es el siguiente). */
function pair(t: TileBuffers, x: number, z: number, b: number, column: number, vol: Volume): number {
  const v = pushVertex(t, x, vol.bottom, z, b, column, vol.top);
  pushVertex(t, x, vol.top, z, b, column, vol.top);
  return v;
}

/**
 * Muros del edificio `b`: un cuadrilátero por tramo de cada anillo (exterior y huecos), del arranque
 * al remate del volumen, según `kinds` (partyWalls): fachada, medianera ciega u omitido. Los tramos
 * seguidos del mismo tipo comparten las esquinas (la normal plana la calcula el shader con
 * derivadas). En las fachadas, la coordenada de columna se acumula por edificio: su parte entera
 * numera la ventana (semilla del hash) y la fraccionaria dice dónde cae el fragmento en la columna.
 * Con los exteriores antihorarios y los huecos horarios en (x, −z) (FORMATO §2), el orden
 * (abajo i, abajo i+1, arriba i+1) deja la cara de afuera mirando hacia afuera, también en patios.
 */
export function writeWalls(t: TileBuffers, s: BuildingSource, b: number, vol: Volume, spacing: number, kinds: Uint8Array): void {
  let column = 0;
  for (let r = s.edificios[b] ?? 0; r < (s.edificios[b + 1] ?? 0); r++) {
    const [from, to] = [s.anillos[r] ?? 0, s.anillos[r + 1] ?? 0];
    if (to - from < 3) continue;
    let [previous, last] = [-1, -1]; // tipo del tramo anterior y su par final
    for (let p = from; p < to; p++) {
      const kind = kinds[p] ?? 0;
      if (kind === DROPPED) {
        previous = -1;
        continue;
      }
      const q = p + 1 < to ? p + 1 : from;
      const [x0, z0, x1, z1] = [s.xz[2 * p] ?? 0, s.xz[2 * p + 1] ?? 0, s.xz[2 * q] ?? 0, s.xz[2 * q + 1] ?? 0];
      const blind = kind === BLIND;
      const lo = kind === previous ? last : pair(t, x0, z0, b, blind ? BLIND_COLUMN : column, vol);
      if (!blind) column += columnsFor(Math.hypot(x1 - x0, z1 - z0), spacing);
      const hi = pair(t, x1, z1, b, blind ? BLIND_COLUMN : column, vol);
      pushTriangle(t, lo, hi, hi + 1);
      pushTriangle(t, lo, hi + 1, lo + 1);
      [previous, last] = [kind, hi];
    }
  }
}
