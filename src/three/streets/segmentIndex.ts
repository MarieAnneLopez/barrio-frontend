import type { Vias } from '../data/format';
import type { Network } from './network';
import { isBridge } from './wayLine';

// Índice en rejilla de los tramos de calzada a ras de suelo: «¿qué calzada pasa más cerca de este
// punto?» (largo de los cruces sin dato, lado de la calle de cada semáforo).

const CELL = 40;
const key = (cx: number, cz: number) => (cx + 2048) * 4096 + (cz + 2048);

export interface RoadHit {
  way: number;
  half: number;
  dist: number;
  /** Punto más cercano sobre el eje y dirección unitaria del tramo (en el sentido del dibujo). */
  x: number;
  z: number;
  dx: number;
  dz: number;
}

export class SegmentIndex {
  private readonly cells = new Map<number, number[]>();
  private readonly seg: number[] = [];
  private readonly net: Network;

  constructor(v: Vias, net: Network) {
    this.net = net;
    for (let w = 0; w < v.count; w++) {
      if (!net.specs[w] || isBridge(v, w)) continue;
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

  nearest(x: number, z: number, radius: number): RoadHit | null {
    let best: RoadHit | null = null;
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
        if (dist <= radius && (!best || dist < best.dist)) {
          best = { way: w, half: this.net.specs[w]?.half ?? 3, dist, x: px, z: pz, dx: dx / length, dz: dz / length };
        }
      }
    });
    return best;
  }
}
