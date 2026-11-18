import type { Vias } from '../data/format';
import type { Network } from './network';
import { isBridge } from './wayLine';

// Índice en rejilla de los tramos de las vías: «¿qué vía pasa más cerca de este punto?» y «¿qué vía
// cubre este punto?» (cruces y semáforos sobre su calzada, faroles y árboles fuera de las demás). Las
// consultas no crean objetos salvo el resultado: los árboles hacen miles.

const CELL = 40;
const key = (cx: number, cz: number) => (cx + 2048) * 4096 + (cz + 2048);

export interface RoadHit {
  /** Tramo, su alcance a cada lado del eje (en roadIndex, la media calzada) y la distancia al eje. */
  way: number; half: number; dist: number;
  /** Punto más cercano sobre el eje, su fracción t del segmento y la dirección unitaria del tramo (dibujo). */
  x: number; z: number; t: number; dx: number; dz: number;
}

export class SegmentIndex {
  private readonly cells = new Map<number, number[]>();
  /** ax, az, bx, bz y tramo de cada segmento. */
  private readonly seg: number[] = [];
  private readonly reach: Float32Array;
  private readonly widest: number;
  private readonly stamp: Uint32Array;
  private query = 0;
  private best = { id: -1, dist: Infinity, t: 0 };

  /** `reach(w)`: hasta dónde llega el tramo w a cada lado de su eje (m); 0 lo deja fuera. */
  constructor(v: Vias, reach: (w: number) => number) {
    this.reach = Float32Array.from({ length: v.count }, (_, w) => Math.max(0, reach(w)));
    this.widest = this.reach.reduce((a, b) => Math.max(a, b), 0);
    for (let w = 0; w < v.count; w++) {
      if (!((this.reach[w] ?? 0) > 0)) continue;
      for (let i = v.tramos[w] ?? 0; i < (v.tramos[w + 1] ?? 0) - 1; i++) {
        const a = v.indices[i] ?? 0, b = v.indices[i + 1] ?? 0;
        const ax = v.nodos[2 * a] ?? 0, az = v.nodos[2 * a + 1] ?? 0, bx = v.nodos[2 * b] ?? 0, bz = v.nodos[2 * b + 1] ?? 0;
        const id = this.seg.length / 5;
        this.seg.push(ax, az, bx, bz, w);
        this.each(Math.min(ax, bx), Math.min(az, bz), Math.max(ax, bx), Math.max(az, bz), (k) => {
          const list = this.cells.get(k);
          if (list) list.push(id);
          else this.cells.set(k, [id]);
        });
      }
    }
    this.stamp = new Uint32Array(this.seg.length / 5);
  }

  private each(x0: number, z0: number, x1: number, z1: number, visit: (k: number) => void): void {
    for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++) {
      for (let cz = Math.floor(z0 / CELL); cz <= Math.floor(z1 / CELL); cz++) visit(key(cx, cz));
    }
  }

  /** Deja en `this.best` el segmento más cercano a menos de `radius` que cumple `keep(id, dist, t)`. */
  private scan(x: number, z: number, radius: number, keep: (id: number, dist: number, t: number) => boolean): void {
    const [q, s, best] = [++this.query, this.seg, this.best];
    [best.id, best.dist, best.t] = [-1, radius, 0];
    this.each(x - radius, z - radius, x + radius, z + radius, (k) => {
      for (const id of this.cells.get(k) ?? []) {
        if (this.stamp[id] === q) continue;
        this.stamp[id] = q;
        const o = 5 * id;
        const ax = s[o] ?? 0, az = s[o + 1] ?? 0, dx = (s[o + 2] ?? 0) - ax, dz = (s[o + 3] ?? 0) - az;
        const l2 = dx * dx + dz * dz || 1;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
        const dist = Math.hypot(x - ax - dx * t, z - az - dz * t);
        if (dist <= best.dist && keep(id, dist, t)) [best.id, best.dist, best.t] = [id, dist, t];
      }
    });
  }

  private hit(id: number, dist: number, t: number): RoadHit {
    const o = 5 * id;
    const s = this.seg;
    const [ax, az, w] = [s[o] ?? 0, s[o + 1] ?? 0, s[o + 4] ?? 0];
    const [dx, dz] = [(s[o + 2] ?? 0) - ax, (s[o + 3] ?? 0) - az];
    const length = Math.hypot(dx, dz) || 1;
    return { way: w, half: this.reach[w] ?? 0, dist, x: ax + dx * t, z: az + dz * t, t, dx: dx / length, dz: dz / length };
  }

  /** El tramo más cercano a menos de `radius` m que cumple `accept` (cualquiera, si no se da). */
  nearest(x: number, z: number, radius: number, accept?: (hit: RoadHit) => boolean): RoadHit | null {
    this.scan(x, z, radius, (id, dist, t) => !accept || accept(this.hit(id, dist, t)));
    return this.best.id >= 0 ? this.hit(this.best.id, this.best.dist, this.best.t) : null;
  }

  /** El tramo que cubre el punto (su eje a menos de su alcance + `margin`), el de eje más cercano; o null. */
  covering(x: number, z: number, margin = 0): RoadHit | null {
    this.scan(x, z, this.widest + margin, (id, dist) => dist < (this.reach[this.seg[5 * id + 4] ?? 0] ?? 0) + margin);
    return this.best.id >= 0 ? this.hit(this.best.id, this.best.dist, this.best.t) : null;
  }
}

/** Calzadas de la red a ras de suelo (sin puentes), con su media calzada de alcance. */
export const roadIndex = (v: Vias, net: Network) => new SegmentIndex(v, (w) => (isBridge(v, w) ? 0 : (net.specs[w]?.half ?? 0)));
