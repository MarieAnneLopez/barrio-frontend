import type { Vias } from '../data/format';
import { isCarDrawn, roadSpec, type RoadSpec, type WayTags } from './roadClass';

// La red vial como grafo: dos tramos que comparten un índice de nodo se tocan ahí (FORMATO §4).
// Un nodo es cruce si llegan 3 o más extremos de calzada (pasar por el medio cuenta 2).

export function wayTags(v: Vias, w: number): WayTags {
  return {
    clase: v.clase[w] ?? 0, banderas: v.banderas[w] ?? 0, sentido: v.sentido[w] ?? 0,
    carriles: v.carriles[w] ?? 0, vmax: v.vmax[w] ?? 0,
  };
}

export interface Network {
  /** Especificación de cada tramo incluido (null si no entra en la red). */
  specs: (RoadSpec | null)[];
  usage: Uint16Array;
  /** Tramos que tocan cada nodo, en listas compactas: list[first[n] .. first[n + 1]). */
  first: Uint32Array;
  list: Uint32Array;
}

/** Red de las calzadas que cumplen `include` (por defecto, las que se dibujan). */
export function buildNetwork(v: Vias, include: (t: WayTags) => boolean = isCarDrawn): Network {
  const nodes = v.nodos.length >> 1;
  const specs = Array.from({ length: v.count }, (_, w) => (include(wayTags(v, w)) ? roadSpec(wayTags(v, w)) : null));
  const usage = new Uint16Array(nodes);
  const touches = new Uint32Array(nodes + 1);
  for (let w = 0; w < v.count; w++) {
    if (!specs[w]) continue;
    const [a, b] = [v.tramos[w] ?? 0, v.tramos[w + 1] ?? 0];
    for (let i = a; i < b; i++) {
      const node = v.indices[i] ?? 0;
      usage[node] = (usage[node] ?? 0) + (i === a || i === b - 1 ? 1 : 2);
      touches[node + 1] = (touches[node + 1] ?? 0) + 1;
    }
  }
  for (let n = 0; n < nodes; n++) touches[n + 1] = (touches[n + 1] ?? 0) + (touches[n] ?? 0);
  const list = new Uint32Array(touches[nodes] ?? 0);
  const cursor = touches.slice(0, nodes);
  for (let w = 0; w < v.count; w++) {
    if (!specs[w]) continue;
    for (let i = v.tramos[w] ?? 0; i < (v.tramos[w + 1] ?? 0); i++) {
      const node = v.indices[i] ?? 0;
      list[cursor[node] ?? 0] = w;
      cursor[node] = (cursor[node] ?? 0) + 1;
    }
  }
  return { specs, usage, first: touches, list };
}

export const isJunction = (net: Network, node: number) => (net.usage[node] ?? 0) >= 3;

/** Mitad de la calzada más ancha que llega al cruce, entre las de rango ≥ `minRank` y distintas de `skip`. */
function widestHalf(net: Network, node: number, minRank: number, skip: number): number {
  if (!isJunction(net, node)) return 0;
  let half = 0;
  for (let k = net.first[node] ?? 0; k < (net.first[node + 1] ?? 0); k++) {
    const w = net.list[k] ?? 0;
    const spec = net.specs[w];
    if (w !== skip && spec && spec.rank >= minRank) half = Math.max(half, spec.half);
  }
  return half;
}

/** Cuánto se apartan del cruce las marcas y el brillo de la vía `w` (0 si pasa por encima). */
export const clearance = (net: Network, node: number, w: number) => widestHalf(net, node, net.specs[w]?.rank ?? 0, w);

/** Radio del cruce: la mitad de la calzada más ancha que llega (0 si no es cruce). */
export const junctionRadius = (net: Network, node: number) => widestHalf(net, node, -1, -1);
