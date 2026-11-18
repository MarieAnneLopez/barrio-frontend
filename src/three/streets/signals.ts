import type { Vias } from '../data/format';
import { yawOf, type Pose } from './instances';
import type { SegmentIndex } from './segmentIndex';

// Semáforos reales de OSM (highway=traffic_signals, TNT3.vias.semaforos). El nodo está sobre el eje
// de la calzada; el poste no: van dos, uno en cada andén de la calzada más cercana, con el brazo
// sobre ella (ubicación de los postes = regla de dibujo).

/** Distancia del poste al borde de la calzada (m). */
const CURB = 0.9;

export function signalPoses(v: Vias, roads: SegmentIndex): Pose[] {
  const poses: Pose[] = [];
  const s = v.semaforos.xz;
  for (let i = 0; i + 1 < s.length; i += 2) {
    const hit = roads.nearest(s[i] ?? 0, s[i + 1] ?? 0, 25);
    if (!hit) continue;
    const [nx, nz] = [-hit.dz, hit.dx]; // derecha del sentido del dibujo
    for (const side of [1, -1]) {
      const offset = side * (hit.half + CURB);
      poses.push({ x: hit.x + nx * offset, y: 0, z: hit.z + nz * offset, yaw: yawOf(-side * nx, -side * nz), scale: 1 });
    }
  }
  return poses;
}
