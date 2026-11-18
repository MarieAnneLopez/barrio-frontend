import type { Vias } from '../data/format';
import { yawOf, type Pose } from './instances';
import { isJunction, junctionRadius, type Network } from './network';
import { locate, rightNormals } from './polyline';
import { isBridge, wayLine } from './wayLine';

// Faroles DECORATIVOS (D105): OSM no registra ningún farol en el barrio (TNT3.puntos.faroles = 0),
// así que la maqueta los reparte por regla, nunca como dato: cada LAMP_STEP m a lo largo de las vías
// principales (terciarias o más), alternando lados, en el andén y fuera de los cruces.

export const LAMP_STEP = 35;
/** Rango mínimo de la vía (roadClass): terciaria = 3. */
const MIN_RANK = 3;
const FROM_CURB = 0.6;
const JUNCTION_GAP = 6;

export function lampPoses(v: Vias, net: Network): Pose[] {
  const poses: Pose[] = [];
  for (let w = 0; w < v.count; w++) {
    const spec = net.specs[w];
    if (!spec || spec.rank < MIN_RANK || isBridge(v, w)) continue;
    const line = wayLine(v, w);
    const nrm = rightNormals(line.xz);
    const n = line.cum.length;
    const total = line.cum[n - 1] ?? 0;
    const junctions: Array<[number, number]> = [];
    line.node.forEach((node, k) => {
      if (node >= 0 && isJunction(net, node)) junctions.push([line.cum[k] ?? 0, junctionRadius(net, node) + JUNCTION_GAP]);
    });
    let k = 0;
    for (let s = LAMP_STEP / 2; s < total; s += LAMP_STEP, k++) {
      if (junctions.some(([at, r]) => Math.abs(at - s) < r)) continue;
      const [i, t] = locate(line.cum, 0, n, s);
      const lerp = (a: ArrayLike<number>, c: number) => (a[2 * i + c] ?? 0) * (1 - t) + (a[2 * i + 2 + c] ?? 0) * t;
      const side = k % 2 === 0 ? 1 : -1;
      const offset = side * (spec.half + FROM_CURB);
      const [nx, nz] = [lerp(nrm, 0), lerp(nrm, 1)];
      poses.push({ x: lerp(line.xz, 0) + nx * offset, y: 0, z: lerp(line.xz, 1) + nz * offset, yaw: yawOf(-side * nx, -side * nz), scale: 1 });
    }
  }
  return poses;
}
