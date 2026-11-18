import { roadLevel } from '../streets/levels';
import { isJunction, junctionRadius, type Network } from '../streets/network';
import { cumulative, rightNormals } from '../streets/polyline';
import type { RoadSpec } from '../streets/roadClass';
import type { WayLine } from '../streets/wayLine';

// Borrador de las aristas del grafo de carriles (laneGraph) antes de empacarlas en arreglos tipados.

export interface EdgeDraft {
  id: number;
  count: number;
  length: number;
  from: number;
  to: number;
  way: number;
  forward: number;
  reverse: number;
  lanes: number;
  offset0: number;
  laneStep: number;
  speed: number;
  weight: number;
  trimStart: number;
  trimEnd: number;
  /** 1 si la vía está recortada en el borde del barrio (FORMATO §4): en su punta sin salida se sale de la escena. */
  border: number;
  /** 1 si la arista empieza en esa punta recortada: por ahí se entra a la escena. */
  entry: number;
}

/** Vértices: x, z, y, largo acumulado, normal x, normal z (6 por vértice). */
export interface Draft { verts: number[]; edges: EdgeDraft[] }

/** Preferencia por clase: más carros en avenidas (trunk, primary, secondary). */
const preference = (spec: RoadSpec) => (spec.rank >= 4 ? 4 : spec.rank === 3 ? 2.2 : spec.rank === 2 ? 1 : 0.35);

/**
 * Arista del vértice `a` al `b` de la línea del tramo (b < a: en contra del dibujo). Se recorta en
 * cada punta el radio del cruce y, en la punta sin salida de una calle de doble sentido, el espacio
 * para dar la vuelta en U (media calzada).
 */
export function addEdge(
  d: Draft, net: Network, line: WayLine, a: number, b: number, w: number, spec: RoadSpec, sentido: number, border: boolean,
): EdgeDraft {
  const step = a <= b ? 1 : -1;
  const order = Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => a + i * step);
  const xz = Float32Array.from(order.flatMap((k) => [line.xz[2 * k] ?? 0, line.xz[2 * k + 1] ?? 0]));
  const cum = cumulative(xz);
  const nrm = rightNormals(xz);
  const length = cum[cum.length - 1] ?? 0;
  const [from, to] = [line.node[a] ?? -1, line.node[b] ?? -1];
  const twoWay = sentido === 0;
  const deadEnd = (n: number) => n >= 0 && (net.usage[n] ?? 0) === 1;
  const room = (n: number) => (isJunction(net, n) ? junctionRadius(net, n) + 0.5 : twoWay && deadEnd(n) ? spec.half : 0);
  const trim = (n: number) => Math.min(room(n), length * 0.3);
  const lanes = twoWay ? 1 : Math.max(1, spec.lanes);
  order.forEach((k, i) => {
    d.verts.push(xz[2 * i] ?? 0, xz[2 * i + 1] ?? 0, (line.y[k] ?? 0) + roadLevel(spec.rank), cum[i] ?? 0, nrm[2 * i] ?? 0, nrm[2 * i + 1] ?? 0);
  });
  const edge: EdgeDraft = {
    id: d.edges.length, count: order.length, length, from, to, way: w, forward: step > 0 ? 1 : 0, reverse: -1, lanes,
    offset0: twoWay ? spec.half / 2 : -spec.half + spec.width / lanes / 2, laneStep: twoWay ? 0 : spec.width / lanes,
    speed: spec.speed / 3.6, weight: preference(spec), trimStart: trim(from), trimEnd: trim(to),
    border: border ? 1 : 0, entry: border && deadEnd(from) ? 1 : 0,
  };
  d.edges.push(edge);
  return edge;
}
