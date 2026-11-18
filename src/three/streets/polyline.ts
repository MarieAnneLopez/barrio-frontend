// Polilíneas en el plano x-z ([x0, z0, x1, z1, …], metros, z al sur): largos acumulados, normales a
// la derecha con inglete (las cintas y los carriles mantienen su ancho en las curvas) y muestreo.

const MAX_MITER = 2.5;

export function cumulative(xz: ArrayLike<number>): Float32Array {
  const n = xz.length >> 1;
  const cum = new Float32Array(n);
  for (let i = 1; i < n; i++) {
    const dx = (xz[2 * i] ?? 0) - (xz[2 * i - 2] ?? 0);
    const dz = (xz[2 * i + 1] ?? 0) - (xz[2 * i - 1] ?? 0);
    cum[i] = (cum[i - 1] ?? 0) + Math.hypot(dx, dz);
  }
  return cum;
}

/** Normal derecha del tramo i → i+1 (unitaria): para quien avanza, (−dz, dx). */
function segmentRight(xz: ArrayLike<number>, i: number): [number, number] {
  const dx = (xz[2 * i + 2] ?? 0) - (xz[2 * i] ?? 0);
  const dz = (xz[2 * i + 3] ?? 0) - (xz[2 * i + 1] ?? 0);
  const length = Math.hypot(dx, dz) || 1;
  return [-dz / length, dx / length];
}

/** Normal derecha por vértice; en los quiebres, la bisectriz escalada (inglete, máx. 2,5×). */
export function rightNormals(xz: ArrayLike<number>): Float32Array {
  const n = xz.length >> 1;
  const out = new Float32Array(2 * n);
  if (n < 2) return out;
  for (let i = 0; i < n; i++) {
    const a = segmentRight(xz, Math.max(0, i - 1));
    const b = segmentRight(xz, Math.min(n - 2, i));
    let [mx, mz] = [a[0] + b[0], a[1] + b[1]];
    const length = Math.hypot(mx, mz);
    if (length < 1e-6) [mx, mz] = a;
    else [mx, mz] = [mx / length, mz / length];
    const scale = Math.min(MAX_MITER, 1 / Math.max(1e-6, mx * a[0] + mz * a[1]));
    out[2 * i] = mx * scale;
    out[2 * i + 1] = mz * scale;
  }
  return out;
}

/** [tramo, fracción] de la distancia `s` en los vértices [from, to) de `cum` (s fuera: se recorta). */
export function locate(cum: ArrayLike<number>, from: number, to: number, s: number): [number, number] {
  let [lo, hi] = [from, to - 2];
  if (hi < lo) return [from, 0];
  if (s <= (cum[from] ?? 0)) return [from, 0];
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((cum[mid] ?? 0) <= s) lo = mid;
    else hi = mid - 1;
  }
  const [a, b] = [cum[lo] ?? 0, cum[lo + 1] ?? 0];
  return [lo, b > a ? Math.min(1, (s - a) / (b - a)) : 0];
}

/** Punto a la distancia `s`, desplazado `offset` m a la derecha; escribe [x, z] en `out`. */
export function offsetPoint(
  xz: ArrayLike<number>, nrm: ArrayLike<number>, cum: ArrayLike<number>,
  from: number, to: number, s: number, offset: number, out: number[],
): number {
  const [i, t] = locate(cum, from, to, s);
  const j = Math.min(i + 1, to - 1);
  const lerp = (k: number) => (xz[2 * i + k] ?? 0) * (1 - t) + (xz[2 * j + k] ?? 0) * t
    + ((nrm[2 * i + k] ?? 0) * (1 - t) + (nrm[2 * j + k] ?? 0) * t) * offset;
  out[0] = lerp(0);
  out[1] = lerp(1);
  return i;
}

export interface Densified { xz: Float32Array; cum: Float32Array; source: Int32Array }

/** Inserta vértices en las distancias `stations` (las de fuera o repetidas se ignoran). */
export function densify(xz: ArrayLike<number>, stations: number[]): Densified {
  const cum = cumulative(xz);
  const n = cum.length;
  const total = cum[n - 1] ?? 0;
  const extra = [...new Set(stations)].filter((s) => s > 1e-3 && s < total - 1e-3 && !cum.some((c) => Math.abs(c - s) < 1e-3));
  const all = [...Array.from(cum, (c, i) => [c, i] as const), ...extra.map((s) => [s, -1] as const)].sort((p, q) => p[0] - q[0]);
  const out = { xz: new Float32Array(all.length * 2), cum: Float32Array.from(all, (p) => p[0]), source: Int32Array.from(all, (p) => p[1]) };
  all.forEach(([s], k) => {
    const [i, t] = locate(cum, 0, n, s);
    out.xz[2 * k] = (xz[2 * i] ?? 0) * (1 - t) + (xz[2 * i + 2] ?? xz[2 * i] ?? 0) * t;
    out.xz[2 * k + 1] = (xz[2 * i + 1] ?? 0) * (1 - t) + (xz[2 * i + 3] ?? xz[2 * i + 1] ?? 0) * t;
  });
  return out;
}
