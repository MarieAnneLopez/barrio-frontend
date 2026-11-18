import { hash01, pickWeighted } from '../streets/hash';
import { locate } from '../streets/polyline';
import type { WalkPaths } from './pathPack';

// Personitas caminando por sus caminos (walkPaths): van y vuelven, un poco a la derecha de su sentido
// para no chocar con quien viene, con un leve balanceo al andar. Quietas con movimiento reducido.

export interface Walkers {
  path: Int32Array; s: Float32Array; dir: Int8Array; speed: Float32Array; side: Float32Array; phase: Float32Array;
  x: Float32Array; y: Float32Array; z: Float32Array; yaw: Float32Array; roll: Float32Array;
}

/** Paso y balanceo al caminar (rad/s y rad). */
const STRIDE = 6.5;
const SWAY = 0.12;

export function createWalkers(p: WalkPaths, capacity: number): Walkers {
  const f = () => new Float32Array(capacity);
  const w: Walkers = {
    path: new Int32Array(capacity), s: f(), dir: new Int8Array(capacity), speed: f(), side: f(), phase: f(),
    x: f(), y: f(), z: f(), yaw: f(), roll: f(),
  };
  for (let i = 0; i < capacity; i++) {
    const path = p.count > 0 ? pickWeighted(p.spawn, hash01(i, 401)) : 0;
    w.path[i] = path;
    w.s[i] = (p.length[path] ?? 0) * hash01(i, 402);
    w.dir[i] = hash01(i, 403) < 0.5 ? 1 : -1;
    w.speed[i] = 0.9 + 0.6 * hash01(i, 404);
    w.side[i] = (p.width[path] ?? 2) * (0.08 + 0.27 * hash01(i, 405)); // dentro del camino: ≤ 0,35 de su ancho
    w.phase[i] = hash01(i, 406) * Math.PI * 2;
  }
  stepWalkers(p, w, capacity, 0, 0, true);
  return w;
}

/** Avanza `active` personas `dt` s (en `still`, de pie y sin moverse) y deja su pose. */
export function stepWalkers(p: WalkPaths, w: Walkers, active: number, dt: number, time: number, still: boolean): void {
  for (let i = 0; i < active; i++) {
    const path = w.path[i] ?? 0;
    const length = p.length[path] ?? 0;
    let [s, dir] = [w.s[i] ?? 0, w.dir[i] ?? 1];
    if (!still) {
      s += dir * (w.speed[i] ?? 1) * dt;
      if (s > length || s < 0) [s, dir] = [Math.min(length, Math.max(0, s)), -dir];
      [w.s[i], w.dir[i]] = [s, dir];
    }
    const [from, to] = [p.start[path] ?? 0, p.start[path + 1] ?? 0];
    const [k, t] = locate(p.cum, from, to, s);
    const j = Math.min(k + 1, to - 1);
    const side = (w.side[i] ?? 0) * dir;
    const mix = (a: Float32Array, c: number) => (a[2 * k + c] ?? 0) * (1 - t) + (a[2 * j + c] ?? 0) * t;
    w.x[i] = mix(p.xz, 0) + mix(p.nrm, 0) * side;
    w.z[i] = mix(p.xz, 1) + mix(p.nrm, 1) * side;
    const swing = still ? 0 : Math.sin(time * STRIDE + (w.phase[i] ?? 0));
    w.y[i] = (p.y[k] ?? 0) * (1 - t) + (p.y[j] ?? 0) * t + Math.abs(swing) * 0.05;
    w.roll[i] = swing * SWAY;
    const [dx, dz] = [(p.xz[2 * j] ?? 0) - (p.xz[2 * k] ?? 0), (p.xz[2 * j + 1] ?? 0) - (p.xz[2 * k + 1] ?? 0)];
    w.yaw[i] = Math.atan2(-dz * dir, dx * dir);
  }
}
