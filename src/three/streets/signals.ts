import type { Vias } from '../data/format';
import { yawOf, type Pose } from './instances';
import type { SegmentIndex } from './segmentIndex';

// Semáforos reales de OSM (highway=traffic_signals, TNT3.vias.semaforos). El nodo está sobre el eje
// de la calzada; el poste no: van dos, uno en cada andén de la calzada más cercana, con el brazo
// sobre ella (ubicación de los postes = regla de dibujo). Si el semáforo está en el nodo mismo del
// cruce, el andén de una calle es la calzada de la otra: el poste se corre a lo largo de su calle
// hasta la esquina (primero hacia el tramo que llega) y, si no hay esquina libre cerca, no se pone.

/** Distancia del poste al borde de su calzada y mínima al borde de cualquier otra (m). */
const CURB = 0.9;
const CLEAR = 0.5;
/** Paso y corrimiento máximo al buscar la esquina (m). */
const STEP = 0.5;
const MAX_SHIFT = 20;

/** Corrimiento a lo largo de (dx, dz), primero hacia adelante, que deja el punto fuera de toda calzada. */
function clearShift(roads: SegmentIndex, x: number, z: number, dx: number, dz: number): number | null {
  for (let k = 0; k * STEP <= MAX_SHIFT; k++) {
    for (const s of k === 0 ? [0] : [k * STEP, -k * STEP]) {
      if (!roads.covering(x + dx * s, z + dz * s, CLEAR)) return s;
    }
  }
  return null;
}

export function signalPoses(v: Vias, roads: SegmentIndex): Pose[] {
  const poses: Pose[] = [];
  const s = v.semaforos.xz;
  for (let i = 0; i + 1 < s.length; i += 2) {
    const hit = roads.nearest(s[i] ?? 0, s[i + 1] ?? 0, 25);
    if (!hit) continue;
    const [nx, nz] = [-hit.dz, hit.dx]; // derecha del sentido del dibujo
    const inward = hit.t > 0.5 ? -1 : 1; // hacia el tramo que llega al nodo
    const [ux, uz] = [hit.dx * inward, hit.dz * inward];
    for (const side of [1, -1]) {
      const offset = side * (hit.half + CURB);
      const [x, z] = [hit.x + nx * offset, hit.z + nz * offset];
      const shift = clearShift(roads, x, z, ux, uz);
      if (shift === null) continue;
      poses.push({ x: x + ux * shift, y: 0, z: z + uz * shift, yaw: yawOf(-side * nx, -side * nz), scale: 1 });
    }
  }
  return poses;
}
