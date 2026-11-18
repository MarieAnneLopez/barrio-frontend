import { TNT3, type Puntos, type Suelo } from '../data/format';
import { areaRings } from './groundAreas';
import { hash01 } from './hash';
import type { Pose } from './instances';

// Árboles: los 248 reales de OSM (natural=tree) en su punto; las 20 hileras reales (natural=tree_row)
// repartidas cada ROW_STEP m (la hilera es dato, la posición de cada árbol no: FORMATO §6), y árboles
// DECORATIVOS por regla dentro de parques y bosques (nunca se cuentan ni se muestran como dato).

export const ROW_STEP = 7;

export interface TreePose extends Pose {
  /** 0 copa redonda, 1 cónica. */
  kind: 0 | 1;
  /** Variación del verde de la copa (multiplica su color). */
  tone: number;
  decorative: boolean;
}

const S = TNT3.clasesSuelo;
/** Árboles decorativos por clase de suelo: [paso de la rejilla (m), probabilidad de cada punto]. */
const DECOR: Record<number, readonly [number, number]> = {
  [S.park]: [14, 0.5], [S.garden]: [12, 0.45], [S.recreation_ground]: [16, 0.4], [S.village_green]: [16, 0.4],
  [S.forest]: [8, 0.85], [S.wood]: [8, 0.85], [S.scrub]: [11, 0.5],
};

/** Variedad fija por posición: forma, giro, tamaño (con la exageración de la maqueta) y tono. */
function tree(x: number, z: number, decorative: boolean): TreePose {
  const [a, b] = [Math.round(x * 10), Math.round(z * 10)];
  const [h1, h2, h3] = [hash01(a, b), hash01(b, a), hash01(a ^ 0x5bd1, b)];
  return { x, y: 0, z, yaw: h1 * Math.PI * 2, scale: 1.7 + h2 * 0.9, kind: h3 > 0.78 ? 1 : 0, tone: 0.8 + 0.4 * hash01(a + b, 7), decorative };
}

/** Punto dentro de un polígono con huecos (regla par-impar sobre todos sus anillos). */
export function insideRings(rings: ArrayLike<number>[], x: number, z: number): boolean {
  let inside = false;
  for (const r of rings) {
    const n = r.length >> 1;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [xi, zi, xj, zj] = [r[2 * i] ?? 0, r[2 * i + 1] ?? 0, r[2 * j] ?? 0, r[2 * j + 1] ?? 0];
      if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    }
  }
  return inside;
}

function decorative(s: Suelo, out: TreePose[]): void {
  for (let a = 0; a < s.count; a++) {
    const rule = DECOR[s.clase[a] ?? 0];
    if (!rule) continue;
    const [step, chance] = rule;
    const rings = areaRings(s, a);
    const outer = rings[0] ?? new Float32Array();
    let [x0, z0, x1, z1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (let i = 0; i + 1 < outer.length; i += 2) {
      [x0, x1] = [Math.min(x0, outer[i] ?? 0), Math.max(x1, outer[i] ?? 0)];
      [z0, z1] = [Math.min(z0, outer[i + 1] ?? 0), Math.max(z1, outer[i + 1] ?? 0)];
    }
    for (let gx = Math.floor(x0 / step); gx <= Math.ceil(x1 / step); gx++) {
      for (let gz = Math.floor(z0 / step); gz <= Math.ceil(z1 / step); gz++) {
        if (hash01(gx, gz ^ 0x3c6e) > chance) continue;
        const x = (gx + 0.5 + 0.7 * (hash01(gz, gx) - 0.5)) * step;
        const z = (gz + 0.5 + 0.7 * (hash01(gx + 17, gz) - 0.5)) * step;
        if (insideRings(rings, x, z)) out.push(tree(x, z, true));
      }
    }
  }
}

export function treePoses(p: Puntos, s: Suelo): TreePose[] {
  const out: TreePose[] = [];
  for (let i = 0; i + 1 < p.arboles.xz.length; i += 2) out.push(tree(p.arboles.xz[i] ?? 0, p.arboles.xz[i + 1] ?? 0, false));
  const h = p.hileras;
  for (let r = 0; r + 1 < h.inicios.length; r++) {
    let carry = ROW_STEP / 2;
    for (let i = h.inicios[r] ?? 0; i + 1 < (h.inicios[r + 1] ?? 0); i++) {
      const [ax, az, bx, bz] = [h.xz[2 * i] ?? 0, h.xz[2 * i + 1] ?? 0, h.xz[2 * i + 2] ?? 0, h.xz[2 * i + 3] ?? 0];
      const length = Math.hypot(bx - ax, bz - az);
      for (; carry < length; carry += ROW_STEP) out.push(tree(ax + ((bx - ax) * carry) / length, az + ((bz - az) * carry) / length, false));
      carry -= length;
    }
  }
  decorative(s, out);
  return out;
}
