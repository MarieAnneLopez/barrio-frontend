import type { Vias } from '../data/format';
import type { Network } from './network';
import { isBridge } from './wayLine';

// Índice en rejilla de los tramos de las vías: «¿qué vía pasa más cerca de este punto?» y «¿qué vía
// cubre este punto?» (cruces y semáforos sobre su calzada, faroles y árboles fuera de las demás).

const CELL = 40;
const key = (cx: number, cz: number) => (cx + 2048) * 4096 + (cz + 2048);

export interface RoadHit {
  way: number;
  /** Alcance del tramo a cada lado de su eje (en roadIndex, la media calzada). */
  half: number;
  dist: number;
  /** Punto más cercano sobre el eje, su fracción t del segmento y la dirección unitaria del tramo (dibujo). */
  x: number;
  z: number;
  t: number;
  dx: number;
  dz: number;
}

export class SegmentIndex {
  private readonly cells = new Map<number, number[]>();
  private readonly seg: number[] = [];
  private readonly reach: Float32Array;
  private readonly widest: number;

  /** `reach(w)`: hasta dónde llega el tramo w a cada lado de su eje (m); 0 lo deja fuera. */
  constructor(v: Vias, reach: (w: number) => number) {
    this.reach = Float32Array.from({ length: v.count }, (_, w) => Math.max(0, reach(w)));
    this.widest = this.reach.reduce((a, b) => Math.max(a, b), 0);
    for (let w = 0; w < v.count; w++) {
      if (!((this.reach[w] ?? 0) > 0)) continue;
      for (let i = v.tramos[w] ?? 0; i < (v.tramos[w + 1] ?? 0) - 1; i++) {
        const [a, b] = [v.indices[i] ?? 0, v.indices[i + 1] ?? 0];
        const id = this.seg.length / 5;
        const [ax, az, bx, bz] = [v.nodos[2 * a] ?? 0, v.nodos[2 * a + 1] ?? 0, v.nodos[2 * b] ?? 0, v.nodos[2 * b + 1] ?? 0];
        this.seg.push(ax, az, bx, bz, w);
        this.each(Math.min(ax, bx), Math.min(az, bz), Math.max(ax, bx), Math.max(az, bz), (k) => {
          const list = this.cells.get(k);
          if (list) list.push(id);
          else this.cells.set(k, [id]);
        });
      }
    }
  }

  private each(x0: number, z0: number, x1: number, z1: number, visit: (k: number) => void): void {
    for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++) {
      for (let cz = Math.floor(z0 / CELL); cz <= Math.floor(z1 / CELL); cz++) visit(key(cx, cz));
    }
  }

  /** Recorre cada segmento a menos de `radius` del punto, con su punto más cercano. */
  private scan(x: number, z: number, radius: number, visit: (hit: RoadHit) => void): void {
    const seen = new Set<number>();
    this.each(x - radius, z - radius, x + radius, z + radius, (k) => {
      for (const id of this.cells.get(k) ?? []) {
        if (seen.has(id)) continue;
        seen.add(id);
        const [ax = 0, az = 0, bx = 0, bz = 0, w = 0] = this.seg.slice(5 * id, 5 * id + 5);
        const [dx, dz] = [bx - ax, bz - az];
        const length = Math.hypot(dx, dz) || 1;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (length * length)));
        const [px, pz] = [ax + dx * t, az + dz * t];
        const dist = Math.hypot(x - px, z - pz);
        if (dist <= radius) visit({ way: w, half: this.reach[w] ?? 0, dist, x: px, z: pz, t, dx: dx / length, dz: dz / length });
      }
    });
  }

  /** El tramo más cercano a menos de `radius` m que cumple `accept` (cualquiera, si no se da). */
  nearest(x: number, z: number, radius: number, accept?: (hit: RoadHit) => boolean): RoadHit | null {
    let best: RoadHit | null = null;
    this.scan(x, z, radius, (hit) => {
      if ((!best || hit.dist < best.dist) && (!accept || accept(hit))) best = hit;
    });
    return best;
  }

  /** El tramo que cubre el punto (su eje a menos de su alcance + `margin`), el de eje más cercano; o null. */
  covering(x: number, z: number, margin = 0): RoadHit | null {
    return this.nearest(x, z, this.widest + margin, (hit) => hit.dist < hit.half + margin);
  }
}

/** Calzadas de la red a ras de suelo (sin puentes), con su media calzada de alcance. */
export const roadIndex = (v: Vias, net: Network) => new SegmentIndex(v, (w) => (isBridge(v, w) ? 0 : (net.specs[w]?.half ?? 0)));
