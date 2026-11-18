import { cumulative, offsetPoint, rightNormals } from '../streets/polyline';

// Caminos de las personitas empacados en arreglos tipados: cada uno con su largo acumulado (0 al
// empezar), normales a la derecha del dibujo, su ancho y un peso para repartir la gente (largo × peso).

export interface PathDraft { xz: number[]; y: number[]; weight: number; width: number }

export interface WalkPaths {
  count: number;
  /** Vértices del camino p: [start[p], start[p + 1]). */
  start: Uint32Array;
  xz: Float32Array;
  y: Float32Array;
  cum: Float32Array;
  nrm: Float32Array;
  length: Float32Array;
  /** Ancho por camino (m): cuánto se apartan a la derecha quienes caminan. */
  width: Float32Array;
  /** Peso acumulado para repartir a la gente. */
  spawn: Float32Array;
}

/** Vértices de la línea desplazada `offset` m a la derecha, entre las distancias `a` y `b` del eje. */
export function offsetSlice(
  xz: ArrayLike<number>, cum: ArrayLike<number>, nrm: ArrayLike<number>, offset: number, a: number, b: number,
): number[] {
  const n = cum.length;
  const point = [0, 0];
  offsetPoint(xz, nrm, cum, 0, n, a, offset, point);
  const out = [point[0] ?? 0, point[1] ?? 0];
  for (let k = 0; k < n; k++) {
    const s = cum[k] ?? 0;
    if (s > a && s < b) out.push((xz[2 * k] ?? 0) + (nrm[2 * k] ?? 0) * offset, (xz[2 * k + 1] ?? 0) + (nrm[2 * k + 1] ?? 0) * offset);
  }
  offsetPoint(xz, nrm, cum, 0, n, b, offset, point);
  out.push(point[0] ?? 0, point[1] ?? 0);
  return out;
}

export function packPaths(drafts: PathDraft[]): WalkPaths {
  const kept = drafts.filter((d) => d.xz.length >= 4);
  const start = new Uint32Array(kept.length + 1);
  kept.forEach((d, p) => (start[p + 1] = (start[p] ?? 0) + d.xz.length / 2));
  const total = start[kept.length] ?? 0;
  const f = (n: number) => new Float32Array(n);
  const out = {
    count: kept.length, start, xz: f(2 * total), y: f(total), cum: f(total), nrm: f(2 * total),
    length: f(kept.length), width: Float32Array.from(kept, (d) => d.width), spawn: f(kept.length),
  };
  let acc = 0;
  kept.forEach((d, p) => {
    const first = start[p] ?? 0;
    const cum = cumulative(d.xz);
    out.xz.set(d.xz, 2 * first);
    out.y.set(d.y, first);
    out.cum.set(cum, first);
    out.nrm.set(rightNormals(d.xz), 2 * first);
    out.length[p] = cum[cum.length - 1] ?? 0;
    out.spawn[p] = acc += (out.length[p] ?? 0) * d.weight;
  });
  return out;
}
