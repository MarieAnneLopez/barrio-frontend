import type { LaneGraph } from './laneGraph';

// Giros en los cruces: al llegar al final de una arista el carro elige una de las que salen de ese
// nodo (nunca la gemela en contra: sin otra salida, traffic.ts lo saca y aparece en otra vía) y la
// une con una curva de Bézier.

/** Dirección unitaria del primer (`atEnd` = false) o del último tramo de la arista. */
export function edgeDirection(g: LaneGraph, e: number, atEnd: boolean, out: number[]): void {
  const [first, last] = [g.start[e] ?? 0, (g.start[e + 1] ?? 1) - 1];
  const [a, b] = atEnd ? [last - 1, last] : [first, first + 1];
  const dx = (g.xz[2 * b] ?? 0) - (g.xz[2 * a] ?? 0);
  const dz = (g.xz[2 * b + 1] ?? 0) - (g.xz[2 * a + 1] ?? 0);
  const length = Math.hypot(dx, dz) || 1;
  out[0] = dx / length;
  out[1] = dz / length;
}

const dirA = [0, 0];
const dirB = [0, 0];

/** Siguiente arista desde el final de `e` (u en [0, 1)); −1 si no hay salida (calle sin salida o borde). */
export function chooseNext(g: LaneGraph, e: number, u: number): number {
  const node = g.to[e] ?? -1;
  if (node < 0) return -1;
  edgeDirection(g, e, true, dirA);
  const [first, last] = [g.outFirst[node] ?? 0, g.outFirst[node + 1] ?? 0];
  let [total, chosen] = [0, -1];
  for (let pass = 0; pass < 2; pass++) {
    let acc = 0;
    for (let k = first; k < last; k++) {
      const c = g.outList[k] ?? -1;
      if (c < 0 || c === g.reverse[e]) continue;
      edgeDirection(g, c, false, dirB);
      // Seguir derecho pesa más que girar: (1,25 + cos del giro) por la preferencia de la vía.
      const cos = (dirA[0] ?? 0) * (dirB[0] ?? 0) + (dirA[1] ?? 0) * (dirB[1] ?? 0);
      acc += (g.weight[c] ?? 0) * (1.25 + cos);
      chosen = c;
      if (pass === 1 && acc > u * total) return c;
    }
    total = acc;
    if (total <= 0) return -1;
  }
  return chosen;
}

/**
 * Curva de giro de p0 (saliendo en la dirección d0) a p2 (llegando en d2): el punto de control es el
 * cruce de las dos rectas, o el punto medio si van casi paralelas. Escribe 6 floats en `out` desde
 * `o` y devuelve el largo aproximado.
 */
export function turnCurve(
  p0x: number, p0z: number, d0x: number, d0z: number, p2x: number, p2z: number, d2x: number, d2z: number,
  out: Float32Array, o: number,
): number {
  const chord = Math.hypot(p2x - p0x, p2z - p0z);
  let [cx, cz] = [(p0x + p2x) / 2, (p0z + p2z) / 2];
  const cross = d0x * d2z - d0z * d2x;
  if (Math.abs(cross) > 0.15) {
    const a = ((p2x - p0x) * d2z - (p2z - p0z) * d2x) / cross;
    if (a > 0 && a < chord * 2 + 4) [cx, cz] = [p0x + d0x * a, p0z + d0z * a];
  }
  out.set([p0x, p0z, cx, cz, p2x, p2z], o);
  return (Math.hypot(cx - p0x, cz - p0z) + Math.hypot(p2x - cx, p2z - cz) + chord) / 2;
}

/** Punto y dirección de la curva en t ∈ [0, 1]: escribe [x, z, dx, dz] en `out`. */
export function bezierAt(c: Float32Array, o: number, t: number, out: number[]): void {
  const [p0x, p0z, cx, cz, p2x, p2z] = [c[o] ?? 0, c[o + 1] ?? 0, c[o + 2] ?? 0, c[o + 3] ?? 0, c[o + 4] ?? 0, c[o + 5] ?? 0];
  const s = 1 - t;
  out[0] = s * s * p0x + 2 * s * t * cx + t * t * p2x;
  out[1] = s * s * p0z + 2 * s * t * cz + t * t * p2z;
  out[2] = 2 * s * (cx - p0x) + 2 * t * (p2x - cx);
  out[3] = 2 * s * (cz - p0z) + 2 * t * (p2z - cz);
}
