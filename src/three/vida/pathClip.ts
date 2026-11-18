import type { Edificios } from '../data/format';
import { footprints } from '../streets/footprints';
import type { PathDraft } from './pathPack';

// Caminos de las personitas partidos donde entran en un edificio (huellas reales de Catastro y OSM):
// nadie camina a través de una pared. Cada tramo se corta exactamente donde cruza un muro (miles de
// tramos, no cientos de miles de puntos de muestra); cada trozo de fuera se detiene WALL_GAP m antes
// de la pared y los de menos de MIN_PIECE m se descartan.

/** Los muros: dónde los cruza el segmento AB (fracciones t ∈ (0, 1), en cualquier orden) y si un punto queda adentro. */
export interface Walls {
  cuts(ax: number, az: number, bx: number, bz: number, out: number[]): void;
  inside(x: number, z: number): boolean;
}

export const WALL_GAP = 0.8;
const MIN_PIECE = 3;
const ascending = (a: number, b: number) => a - b;

/** Muros de los edificios que tocan el suelo: bajo un voladizo (piso base > 0) sí se pasa; los subterráneos no cuentan. */
export function footprintWalls(e: Edificios): Walls {
  const grid = footprints(e);
  const ground = (b: number) => (e.base[b] ?? 0) === 0;
  return {
    cuts: (ax, az, bx, bz, out) => grid.crossings(ax, az, bx, bz, out, ground),
    inside: (x, z) => grid.contains(x, z, ground),
  };
}

export function clipOutside(d: PathDraft, walls: Walls): PathDraft[] {
  const out: PathDraft[] = [];
  let [xz, y, length] = [[] as number[], [] as number[], 0];
  const add = (px: number, pz: number, py: number) => {
    const n = xz.length;
    const step = n >= 2 ? Math.sqrt((px - (xz[n - 2] ?? 0)) ** 2 + (pz - (xz[n - 1] ?? 0)) ** 2) : 0;
    if (n >= 2 && step < 1e-6) return; // el mismo punto
    length += step;
    xz.push(px, pz);
    y.push(py);
  };
  const flush = () => {
    if (xz.length >= 4 && length >= MIN_PIECE) out.push({ ...d, xz, y });
    [xz, y, length] = [[], [], 0];
  };
  /** ¿El último trecho visto quedó adentro? null al empezar el camino. */
  let wasInside: boolean | null = null;
  const ts: number[] = [];
  for (let i = 0; 2 * i + 3 < d.xz.length; i++) {
    const [ax, az, bx, bz] = [d.xz[2 * i] ?? 0, d.xz[2 * i + 1] ?? 0, d.xz[2 * i + 2] ?? 0, d.xz[2 * i + 3] ?? 0];
    const [ya, yb] = [d.y[i] ?? 0, d.y[i + 1] ?? 0];
    const put = (t: number) => add(ax + (bx - ax) * t, az + (bz - az) * t, ya + (yb - ya) * t);
    const gap = WALL_GAP / (Math.sqrt((bx - ax) ** 2 + (bz - az) ** 2) || 1);
    ts.length = 0;
    walls.cuts(ax, az, bx, bz, ts);
    ts.push(0, 1);
    if (ts.length > 2) ts.sort(ascending);
    let from = 0; // donde el trozo actual entró a este tramo
    for (let k = 0; k + 1 < ts.length; k++) {
      const [t0, t1] = [ts[k] ?? 0, ts[k + 1] ?? 1];
      if (t1 - t0 < 1e-9) continue;
      const inside = walls.inside(ax + ((bx - ax) * (t0 + t1)) / 2, az + ((bz - az) * (t0 + t1)) / 2);
      if (inside && wasInside === false) {
        put(Math.max(t0 - gap, from));
        flush();
      } else if (!inside && wasInside !== false) put((from = wasInside ? Math.min(t0 + gap, t1) : t0));
      wasInside = inside;
    }
    if (wasInside === false) put(1);
  }
  flush();
  return out;
}
