import { locate } from '../streets/polyline';
import type { LaneGraph } from './laneGraph';
import type { Traffic } from './traffic';
import { bezierAt } from './turns';

// Dónde está un carro sobre su arista: el eje interpolado más el carril, a la derecha del sentido de
// avance (las normales del grafo apuntan a la derecha de quien avanza).

/** Desplazamiento del carril `lane` a la derecha del eje de la arista (m). */
export function laneOffset(g: LaneGraph, e: number, lane: number): number {
  return (g.offset0[e] ?? 0) + Math.min(lane, Math.max(0, (g.lanes[e] ?? 1) - 1)) * (g.laneStep[e] ?? 0);
}

/** Escribe [x, y, z, dx, dz] del punto a `s` m del inicio de la arista con `offset` a la derecha. */
export function edgePose(g: LaneGraph, e: number, s: number, offset: number, out: number[]): void {
  const [from, to] = [g.start[e] ?? 0, g.start[e + 1] ?? 0];
  const [i, t] = locate(g.cum, from, to, s);
  const j = Math.min(i + 1, to - 1);
  const mix = (a: ArrayLike<number>, k: number) => (a[2 * i + k] ?? 0) * (1 - t) + (a[2 * j + k] ?? 0) * t;
  out[0] = mix(g.xz, 0) + mix(g.nrm, 0) * offset;
  out[1] = (g.y[i] ?? 0) * (1 - t) + (g.y[j] ?? 0) * t;
  out[2] = mix(g.xz, 1) + mix(g.nrm, 1) * offset;
  const dx = (g.xz[2 * j] ?? 0) - (g.xz[2 * i] ?? 0);
  const dz = (g.xz[2 * j + 1] ?? 0) - (g.xz[2 * i + 1] ?? 0);
  const length = Math.hypot(dx, dz) || 1;
  out[3] = dx / length;
  out[4] = dz / length;
}

const A = [0, 0, 0, 0, 0];
const P = [0, 0, 0, 0];

/** Pose del carro i (sobre su arista o en la curva de giro) con su escala de aparición o salida. */
export function carPose(g: LaneGraph, tr: Traffic, i: number): void {
  const e = tr.edge[i] ?? 0;
  let scale = Math.min(1, (tr.age[i] ?? 0) / 0.8);
  if (tr.turning[i]) {
    const t = tr.t[i] ?? 0;
    bezierAt(tr.curve, 6 * i, t, P);
    [tr.x[i], tr.z[i], tr.yaw[i]] = [P[0] ?? 0, P[1] ?? 0, Math.atan2(-(P[3] ?? 0), P[2] ?? 1)];
    tr.y[i] = (tr.curveY[2 * i] ?? 0) * (1 - t) + (tr.curveY[2 * i + 1] ?? 0) * t;
  } else {
    edgePose(g, e, tr.s[i] ?? 0, laneOffset(g, e, tr.lane[i] ?? 0), A);
    [tr.x[i], tr.y[i], tr.z[i], tr.yaw[i]] = [A[0] ?? 0, A[1] ?? 0, A[2] ?? 0, Math.atan2(-(A[4] ?? 0), A[3] ?? 1)];
    const left = (g.length[e] ?? 0) - (g.trimEnd[e] ?? 0) - (tr.s[i] ?? 0);
    if (tr.deadEnd[e]) scale = Math.min(scale, Math.max(0, left / 6));
  }
  tr.scale[i] = scale;
}
