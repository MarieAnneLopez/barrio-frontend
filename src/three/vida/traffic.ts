import { hash01, pickWeighted } from '../streets/hash';
import type { LaneGraph } from './laneGraph';
import { following } from './following';
import { carPose, edgePose, laneOffset } from './trafficPose';
import { chooseNext, turnCurve } from './turns';

// Carros por el grafo de carriles, en arreglos tipados y un solo bucle por cuadro (≈ 0,2 ms para 520
// carros): avanzan por su arista a la velocidad de la vía, giran en los cruces con una curva y, en una
// calle sin salida o en el borde del barrio, se van y aparecen en otra vía (con un desvanecido corto).

export interface Traffic {
  edge: Int32Array; s: Float32Array; lane: Uint8Array; pace: Float32Array; age: Float32Array;
  turning: Uint8Array; t: Float32Array; next: Int32Array; nextLane: Uint8Array;
  curve: Float32Array; curveLength: Float32Array; curveY: Float32Array; decisions: Uint32Array;
  /** Freno por el carro de adelante (0–1) y aristas sin salida. */
  limit: Float32Array; deadEnd: Uint8Array;
  /** Pose de salida por carro. */
  x: Float32Array; y: Float32Array; z: Float32Array; yaw: Float32Array; scale: Float32Array;
}

const A = [0, 0, 0, 0, 0];
const B = [0, 0, 0, 0, 0];
const rand = (tr: Traffic, i: number) => hash01(i * 7919 + 13, (tr.decisions[i] = (tr.decisions[i] ?? 0) + 1));

export function createTraffic(g: LaneGraph, capacity: number): Traffic {
  const f = () => new Float32Array(capacity);
  const tr: Traffic = {
    edge: new Int32Array(capacity), s: f(), lane: new Uint8Array(capacity), pace: f(), age: f(), turning: new Uint8Array(capacity),
    t: f(), next: new Int32Array(capacity), nextLane: new Uint8Array(capacity), curve: new Float32Array(6 * capacity),
    curveLength: f(), curveY: new Float32Array(2 * capacity), decisions: new Uint32Array(capacity), limit: f().fill(1),
    deadEnd: Uint8Array.from({ length: g.edges }, (_, e) => (chooseNext(g, e, 0.5) < 0 ? 1 : 0)),
    x: f(), y: f(), z: f(), yaw: f(), scale: f(),
  };
  for (let i = 0; i < capacity; i++) {
    tr.pace[i] = 0.85 + 0.3 * hash01(i, 99);
    spawn(g, tr, i);
    tr.age[i] = 5;
    carPose(g, tr, i);
  }
  return tr;
}

function spawn(g: LaneGraph, tr: Traffic, i: number): void {
  const e = g.edges > 0 ? pickWeighted(g.spawn, rand(tr, i)) : 0;
  const lo = g.trimStart[e] ?? 0;
  const hi = Math.max(lo, (g.length[e] ?? 0) - (g.trimEnd[e] ?? 0));
  tr.edge[i] = e;
  tr.s[i] = lo + (hi - lo) * rand(tr, i);
  tr.lane[i] = Math.floor(rand(tr, i) * (g.lanes[e] ?? 1));
  tr.turning[i] = 0;
  tr.age[i] = 0;
}

function advance(g: LaneGraph, tr: Traffic, i: number, dt: number): void {
  tr.age[i] = (tr.age[i] ?? 0) + dt;
  const e = tr.edge[i] ?? 0;
  const v = (g.speed[e] ?? 8) * (tr.pace[i] ?? 1) * (tr.limit[i] ?? 1);
  if (tr.turning[i]) {
    tr.t[i] = (tr.t[i] ?? 0) + (v * 0.6 * dt) / Math.max(0.5, tr.curveLength[i] ?? 1);
    if ((tr.t[i] ?? 0) < 1) return;
    const n = tr.next[i] ?? 0;
    [tr.edge[i], tr.lane[i], tr.turning[i]] = [n, tr.nextLane[i] ?? 0, 0];
    tr.s[i] = (g.trimStart[n] ?? 0) + ((tr.t[i] ?? 1) - 1) * (tr.curveLength[i] ?? 0);
    return;
  }
  tr.s[i] = (tr.s[i] ?? 0) + v * dt;
  const end = (g.length[e] ?? 0) - (g.trimEnd[e] ?? 0);
  if ((tr.s[i] ?? 0) < end) return;
  const n = chooseNext(g, e, rand(tr, i));
  if (n < 0) return spawn(g, tr, i);
  const lane = Math.min(tr.lane[i] ?? 0, (g.lanes[n] ?? 1) - 1);
  edgePose(g, e, end, laneOffset(g, e, tr.lane[i] ?? 0), A);
  edgePose(g, n, g.trimStart[n] ?? 0, laneOffset(g, n, lane), B);
  const length = turnCurve(A[0] ?? 0, A[2] ?? 0, A[3] ?? 0, A[4] ?? 0, B[0] ?? 0, B[2] ?? 0, B[3] ?? 0, B[4] ?? 0, tr.curve, 6 * i);
  [tr.curveLength[i], tr.curveY[2 * i], tr.curveY[2 * i + 1]] = [length, A[1] ?? 0, B[1] ?? 0];
  [tr.next[i], tr.nextLane[i], tr.turning[i], tr.t[i]] = [n, lane, length < 0.3 ? 0 : 1, 0];
  if (length < 0.3) [tr.edge[i], tr.lane[i], tr.s[i]] = [n, lane, g.trimStart[n] ?? 0];
}

/** Avanza `active` carros `dt` segundos (con frenado detrás del de adelante) y deja su pose. */
export function stepTraffic(g: LaneGraph, tr: Traffic, active: number, dt: number): void {
  following(g, tr, active);
  for (let i = 0; i < active; i++) {
    advance(g, tr, i, dt);
    carPose(g, tr, i);
  }
}
