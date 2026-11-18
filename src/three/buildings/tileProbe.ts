import type { TileData } from './protocol';

// Lecturas de una tesela para las pruebas: triángulos, alturas y normales de cara.

export const triangleCount = (t: TileData): number => t.index.length / 3;

export const vertexY = (t: TileData, v: number): number => t.position[3 * v + 1] ?? NaN;

const vertex = (t: TileData, v: number): [number, number, number] => [
  t.position[3 * v] ?? 0, t.position[3 * v + 1] ?? 0, t.position[3 * v + 2] ?? 0,
];

/** Los tres vértices de la cara f. */
export const faceVertices = (t: TileData, f: number): [number, number, number] => [
  t.index[3 * f] ?? 0, t.index[3 * f + 1] ?? 0, t.index[3 * f + 2] ?? 0,
];

/** Normal sin normalizar de la cara f (regla de la mano derecha sobre el orden de sus vértices). */
export function faceNormal(t: TileData, f: number): [number, number, number] {
  const [ia, ib, ic] = faceVertices(t, f);
  const [a, b, c] = [vertex(t, ia), vertex(t, ib), vertex(t, ic)];
  const [ux, uy, uz] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const [wx, wy, wz] = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  return [uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx];
}

/** ¿El punto (x, z) cae dentro de la proyección en planta de la cara f? */
export function faceCovers(t: TileData, f: number, x: number, z: number): boolean {
  const p = faceVertices(t, f).map((v) => vertex(t, v));
  const sides = p.map((a, i) => {
    const b = p[(i + 1) % 3] ?? a;
    return Math.sign((b[0] - a[0]) * (z - a[2]) - (b[2] - a[2]) * (x - a[0]));
  });
  return sides.every((s) => s >= 0) || sides.every((s) => s <= 0);
}
