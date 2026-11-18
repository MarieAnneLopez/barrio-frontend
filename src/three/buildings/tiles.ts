import type { BuildingSource } from './protocol';
import { LEVEL_HEIGHT, volumeOf } from './volume';

// Teselas espaciales de los edificios: una malla fusionada por tesela de TILE_SIZE metros, para que
// three recorte por frustum las que no se ven y la elección con el puntero pruebe pocas cajas.

export const TILE_SIZE = 400;

export interface TilePlan {
  key: string;
  col: number;
  row: number;
  /** Edificios con volumen visible cuyo centro cae en la tesela, en orden de índice. */
  buildings: number[];
}

/** Centro (x, z) de la caja del anillo exterior del edificio `b`. */
export function footprintCenter(s: Pick<BuildingSource, 'xz' | 'anillos' | 'edificios'>, b: number): [number, number] {
  const ring = s.edificios[b] ?? 0;
  const [from, to] = [s.anillos[ring] ?? 0, s.anillos[ring + 1] ?? 0];
  let [x0, z0, x1, z1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (let v = from; v < to; v++) {
    const [x, z] = [s.xz[2 * v] ?? 0, s.xz[2 * v + 1] ?? 0];
    [x0, z0, x1, z1] = [Math.min(x0, x), Math.min(z0, z), Math.max(x1, x), Math.max(z1, z)];
  }
  return to > from ? [(x0 + x1) / 2, (z0 + z1) / 2] : [0, 0];
}

/** Reparte los edificios visibles en teselas; orden fijo por fila (z) y columna (x). */
export function partition(s: BuildingSource, tileSize = TILE_SIZE, levelHeight = LEVEL_HEIGHT): TilePlan[] {
  const cells = new Map<string, TilePlan>();
  for (let b = 0; b < s.count; b++) {
    if (!volumeOf(s, b, levelHeight)) continue;
    const [x, z] = footprintCenter(s, b);
    const [col, row] = [Math.floor(x / tileSize), Math.floor(z / tileSize)];
    const key = `${col},${row}`;
    const cell = cells.get(key) ?? { key, col, row, buildings: [] };
    cell.buildings.push(b);
    cells.set(key, cell);
  }
  return [...cells.values()].sort((a, b) => a.row - b.row || a.col - b.col);
}
