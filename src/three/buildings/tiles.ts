import type { BuildingSource } from './protocol';
import { LEVEL_HEIGHT, volumeOf, type Volume } from './volume';

// Teselas espaciales de los edificios: una malla fusionada por tesela de TILE_SIZE metros, para que
// three recorte por frustum las que no se ven y la elección con el puntero pruebe pocas cajas.

export const TILE_SIZE = 400;
/** Edificios por paso cuando se recorren todos (≈ 1 ms): el respaldo en tandas cede entre pasos. */
export const STEP_BUILDINGS = 1024;

/** Corre un generador del constructor hasta el final (worker, pruebas y llamadas de una vez). */
export function drain<T>(steps: Generator<void, T>): T {
  for (;;) {
    const step = steps.next();
    if (step.done) return step.value;
  }
}

/** Volumen dibujado de cada edificio (null si no asoma); cede cada STEP_BUILDINGS edificios. */
export function* volumesOf(s: BuildingSource, levelHeight = LEVEL_HEIGHT): Generator<void, Array<Volume | null>> {
  const volumes: Array<Volume | null> = [];
  for (let b = 0; b < s.count; b++) {
    if (b % STEP_BUILDINGS === 0) yield;
    volumes.push(volumeOf(s, b, levelHeight));
  }
  return volumes;
}

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

/** Reparte en teselas los edificios con volumen; orden fijo por fila (z) y columna (x). Cede cada STEP_BUILDINGS. */
export function* partitionSteps(s: BuildingSource, volumes: ReadonlyArray<Volume | null>, tileSize = TILE_SIZE): Generator<void, TilePlan[]> {
  const cells = new Map<string, TilePlan>();
  for (let b = 0; b < s.count; b++) {
    if (b % STEP_BUILDINGS === 0) yield;
    if (!volumes[b]) continue;
    const [x, z] = footprintCenter(s, b);
    const [col, row] = [Math.floor(x / tileSize), Math.floor(z / tileSize)];
    const key = `${col},${row}`;
    const cell = cells.get(key) ?? { key, col, row, buildings: [] };
    cell.buildings.push(b);
    cells.set(key, cell);
  }
  return [...cells.values()].sort((a, b) => a.row - b.row || a.col - b.col);
}

/** El reparto en teselas de una vez. */
export function partition(s: BuildingSource, tileSize = TILE_SIZE, levelHeight = LEVEL_HEIGHT): TilePlan[] {
  return drain(partitionSteps(s, drain(volumesOf(s, levelHeight)), tileSize));
}
