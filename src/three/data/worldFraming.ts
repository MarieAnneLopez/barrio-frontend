import { TNT3, type Tintal3D } from './format';

// Encuadre de la maqueta con los datos reales (TNT3): mismas reglas que referenceView.gridAzimuth y
// framing.densestSpot (D83), pero sobre las columnas binarias en metros, sin GeoJSON.

const CELL = 300;
/** Lado típico de una manzana de El Tintal (m); la separación entre calles de la referencia (D83). */
export const BLOCK_SIZE_M = 110;

export interface WorldFraming {
  /** Azimut dominante de la malla vial (0–90°, desde el norte). */
  grid: number;
  /** Centro (x, z) de la zona con más edificios. */
  spot: [number, number];
  blockSize: number;
  /** Borde del barrio [x0, z0, x1, z1, …] (anillo exterior del área «barrio» del suelo). */
  outline: Float32Array;
  /** Centro y tamaño de la caja del borde, en metros. */
  center: [number, number];
  size: [number, number];
}

/** Anillo exterior del área «barrio» (la primera del suelo, FORMATO §5). */
export function barrioOutline(world: Pick<Tintal3D, 'suelo'>): Float32Array {
  const { suelo } = world;
  for (let a = 0; a < suelo.count; a++) {
    if (suelo.clase[a] !== TNT3.clasesSuelo.barrio) continue;
    const ring = suelo.areas[a] ?? 0;
    return suelo.xz.slice(2 * (suelo.anillos[ring] ?? 0), 2 * (suelo.anillos[ring + 1] ?? 0));
  }
  return new Float32Array();
}

function gridAzimuth({ vias }: Pick<Tintal3D, 'vias'>): number {
  const hist = new Float64Array(90);
  for (let w = 0; w < vias.count; w++) {
    for (let i = vias.tramos[w] ?? 0; i < (vias.tramos[w + 1] ?? 0) - 1; i++) {
      const [a, b] = [vias.indices[i] ?? 0, vias.indices[i + 1] ?? 0];
      const dx = (vias.nodos[2 * b] ?? 0) - (vias.nodos[2 * a] ?? 0);
      const dz = (vias.nodos[2 * b + 1] ?? 0) - (vias.nodos[2 * a + 1] ?? 0);
      const az = Math.floor(((((Math.atan2(dx, -dz) * 180) / Math.PI) % 90) + 90) % 90) % 90;
      hist[az] = (hist[az] ?? 0) + Math.hypot(dx, dz);
    }
  }
  const smooth = (a: number) => [-2, -1, 0, 1, 2].reduce((t, d) => t + (hist[(a + d + 90) % 90] ?? 0), 0);
  let best = 0;
  for (let a = 1; a < 90; a++) if (smooth(a) > smooth(best)) best = a;
  return best;
}

function densestSpot({ edificios }: Pick<Tintal3D, 'edificios'>, fallback: [number, number]): [number, number] {
  const cells = new Map<string, number>();
  for (let b = 0; b < edificios.count; b++) {
    const first = edificios.anillos[edificios.edificios[b] ?? 0] ?? 0;
    const key = `${Math.floor((edificios.xz[2 * first] ?? 0) / CELL)},${Math.floor((edificios.xz[2 * first + 1] ?? 0) / CELL)}`;
    cells.set(key, (cells.get(key) ?? 0) + 1);
  }
  let best: [number, number, number] = [-1, ...fallback];
  for (const key of cells.keys()) {
    const [cx = 0, cz = 0] = key.split(',').map(Number);
    let sum = 0;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) sum += cells.get(`${cx + dx},${cz + dz}`) ?? 0;
    if (sum > best[0]) best = [sum, (cx + 0.5) * CELL, (cz + 0.5) * CELL];
  }
  return [best[1], best[2]];
}

export function worldFraming(world: Pick<Tintal3D, 'suelo' | 'vias' | 'edificios'>): WorldFraming {
  const outline = barrioOutline(world);
  let [minX, minZ, maxX, maxZ] = [Infinity, Infinity, -Infinity, -Infinity];
  for (let i = 0; i + 1 < outline.length; i += 2) {
    const [x, z] = [outline[i] ?? 0, outline[i + 1] ?? 0];
    [minX, maxX, minZ, maxZ] = [Math.min(minX, x), Math.max(maxX, x), Math.min(minZ, z), Math.max(maxZ, z)];
  }
  const empty = outline.length < 6;
  const center: [number, number] = empty ? [0, 0] : [(minX + maxX) / 2, (minZ + maxZ) / 2];
  const size: [number, number] = empty ? [4000, 2600] : [maxX - minX, maxZ - minZ];
  return { grid: gridAzimuth(world), spot: densestSpot(world, center), blockSize: BLOCK_SIZE_M, outline, center, size };
}
