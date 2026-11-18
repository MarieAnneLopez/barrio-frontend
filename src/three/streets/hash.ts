// Azar determinista (sin Math.random): el barrio, sus árboles, carros y personas son los mismos en
// cada visita y las pruebas pueden repetirse.

/** Número en [0, 1) a partir de dos enteros (hash de 32 bits tipo murmur). */
export function hash01(a: number, b = 0): number {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be59b, 0xc2b2ae35);
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Generador fijo (mulberry32) para secuencias largas. */
export function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Índice elegido al azar según pesos acumulados (`cumulative` creciente; `u` en [0, 1)). */
export function pickWeighted(cumulative: ArrayLike<number>, u: number): number {
  const total = cumulative[cumulative.length - 1] ?? 0;
  const target = u * total;
  let [lo, hi] = [0, cumulative.length - 1];
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((cumulative[mid] ?? 0) > target) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
