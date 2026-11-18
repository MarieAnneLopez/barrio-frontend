import { TNT3, type Vias } from '../data/format';
import { LEVEL, roadLevel } from './levels';
import { wayTags } from './network';
import { locate, rightNormals } from './polyline';
import { footSpec, isCarDrawn, roadSpec } from './roadClass';
import type { DayNight, Sink } from './sink';
import { isBridge, wayLine } from './wayLine';

// Estructura de los puentes (regla de dibujo): el tablero lo dibujan la calzada o el sendero a su
// altura; aquí van sus costados (grosor DECK) y pilas cada PILLAR_STEP m donde va alto.

export const DECK = 0.9;
const PILLAR_STEP = 18;
const MIN_PILLAR = 2.5;

type V3 = [number, number, number];

/** Cuadrilátero de cara hacia `normal` (las esquinas en orden alrededor del borde). */
function quad(sink: Sink, c: [V3, V3, V3, V3], normal: V3, color: DayNight): void {
  const [nx, ny, nz] = normal;
  const k = c.map(([x, y, z]) => sink.vertex(x, y, z, color, nx, ny, nz));
  const [a, b, d] = [c[0], c[1], c[2]];
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const w = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  const cross = [(u[1] ?? 0) * (w[2] ?? 0) - (u[2] ?? 0) * (w[1] ?? 0), (u[2] ?? 0) * (w[0] ?? 0) - (u[0] ?? 0) * (w[2] ?? 0), (u[0] ?? 0) * (w[1] ?? 0) - (u[1] ?? 0) * (w[0] ?? 0)];
  const flip = (cross[0] ?? 0) * nx + (cross[1] ?? 0) * ny + (cross[2] ?? 0) * nz < 0;
  const [q0 = 0, q1 = 0, q2 = 0, q3 = 0] = k;
  if (flip) sink.index.push(q0, q2, q1, q0, q3, q2);
  else sink.index.push(q0, q1, q2, q0, q2, q3);
}

function pillar(sink: Sink, x: number, z: number, half: number, top: number, color: DayNight): void {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const [cx, cz] = [x + dx * half, z + dz * half];
    const [tx, tz] = [-dz * half, dx * half];
    quad(sink, [[cx - tx, 0, cz - tz], [cx + tx, 0, cz + tz], [cx + tx, top, cz + tz], [cx - tx, top, cz - tz]], [dx, 0, dz], color);
  }
}

/** Medio ancho del tablero y su altura base, o null si el tramo no es un puente que se dibuja. */
function deck(v: Vias, w: number): { half: number; level: number; pillar: number } | null {
  if (!isBridge(v, w) || (v.banderas[w] ?? 0) & TNT3.banderasVia.tunel) return null;
  const t = wayTags(v, w);
  if (isCarDrawn(t)) {
    const spec = roadSpec(t);
    return { half: spec.half, level: roadLevel(spec.rank), pillar: 0.8 };
  }
  const foot = footSpec(t.clase);
  return foot ? { half: foot.width / 2, level: LEVEL.foot, pillar: 0.35 } : null;
}

export function pushBridges(sink: Sink, v: Vias, color: DayNight): number {
  const before = sink.triangles;
  for (let w = 0; w < v.count; w++) {
    const d = deck(v, w);
    if (!d) continue;
    const line = wayLine(v, w);
    const nrm = rightNormals(line.xz);
    const n = line.y.length;
    const at = (i: number, side: number, drop: number): V3 => [
      (line.xz[2 * i] ?? 0) + side * (nrm[2 * i] ?? 0) * d.half, Math.max(0, (line.y[i] ?? 0) + d.level - drop),
      (line.xz[2 * i + 1] ?? 0) + side * (nrm[2 * i + 1] ?? 0) * d.half,
    ];
    for (const side of [-1, 1]) {
      for (let i = 0; i < n - 1; i++) {
        if ((line.y[i] ?? 0) < 0.3 && (line.y[i + 1] ?? 0) < 0.3) continue;
        const [nx, nz] = [side * (nrm[2 * i] ?? 0), side * (nrm[2 * i + 1] ?? 0)];
        const length = Math.hypot(nx, nz) || 1;
        quad(sink, [at(i, side, 0), at(i, side, DECK), at(i + 1, side, DECK), at(i + 1, side, 0)], [nx / length, 0, nz / length], color);
      }
    }
    const total = line.cum[n - 1] ?? 0;
    for (let s = PILLAR_STEP / 2; s < total; s += PILLAR_STEP) {
      const [i, t] = locate(line.cum, 0, n, s);
      const y = (line.y[i] ?? 0) * (1 - t) + (line.y[i + 1] ?? 0) * t;
      if (y < MIN_PILLAR) continue;
      const lerp = (k: number) => (line.xz[2 * i + k] ?? 0) * (1 - t) + (line.xz[2 * i + 2 + k] ?? 0) * t;
      pillar(sink, lerp(0), lerp(1), d.pillar, y + d.level - DECK, color);
    }
  }
  return sink.triangles - before;
}
