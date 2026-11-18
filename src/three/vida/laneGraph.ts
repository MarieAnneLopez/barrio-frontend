import type { Vias } from '../data/format';
import { buildNetwork, isJunction } from '../streets/network';
import { isCarDriven } from '../streets/roadClass';
import { wayLine } from '../streets/wayLine';
import { addEdge, type Draft } from './laneDraft';
import { packLaneGraph } from './lanePack';

// Grafo de carriles para los carros, sobre la red vial real (FORMATO §4): los tramos se tocan en los
// nodos compartidos y se parten en los cruces; cada trozo da una arista dirigida por sentido
// permitido: SENT = 1 a favor del dibujo, −1 en contra, 0 las dos (un carril por lado, por la derecha).

export interface LaneGraph {
  edges: number;
  /** Vértices de la arista e en las listas por vértice: [start[e], start[e + 1]). */
  start: Uint32Array;
  /** Por vértice, en el orden de avance: eje, altura del carro, largo acumulado (0 al empezar) y normal derecha. */
  xz: Float32Array;
  y: Float32Array;
  cum: Float32Array;
  nrm: Float32Array;
  length: Float32Array;
  from: Int32Array;
  to: Int32Array;
  way: Int32Array;
  /** 1 si avanza en el orden de los nodos del tramo. */
  forward: Uint8Array;
  /** Arista gemela en sentido contrario (doble sentido) o −1. */
  reverse: Int32Array;
  /** Carril k: a offset0 + k · laneStep m a la derecha del eje. */
  lanes: Uint8Array;
  offset0: Float32Array;
  laneStep: Float32Array;
  /** m/s (vmax de OSM o la regla de la clase) y preferencia (más en avenidas). */
  speed: Float32Array;
  weight: Float32Array;
  /** Lo que se recorta en cada punta para girar por fuera del cruce (m). */
  trimStart: Float32Array;
  trimEnd: Float32Array;
  /** Aristas que salen de cada nodo: outList[outFirst[n] .. outFirst[n + 1]). */
  outFirst: Uint32Array;
  outList: Int32Array;
  /** Peso acumulado para aparecer (largo × preferencia). */
  spawn: Float32Array;
}

export function buildLaneGraph(v: Vias): LaneGraph {
  const net = buildNetwork(v, isCarDriven);
  const d: Draft = { verts: [], edges: [] };
  for (let w = 0; w < v.count; w++) {
    const spec = net.specs[w];
    if (!spec) continue;
    const sentido = v.sentido[w] ?? 0;
    const line = wayLine(v, w);
    let a = 0;
    for (let k = 1; k < line.node.length; k++) {
      const node = line.node[k] ?? -1;
      if (k < line.node.length - 1 && !(node >= 0 && isJunction(net, node))) continue;
      if ((line.cum[k] ?? 0) - (line.cum[a] ?? 0) > 0.5) {
        const ahead = sentido >= 0 ? addEdge(d, net, line, a, k, w, spec, sentido) : null;
        const back = sentido <= 0 ? addEdge(d, net, line, k, a, w, spec, sentido) : null;
        if (ahead && back) [ahead.reverse, back.reverse] = [back.id, ahead.id];
      }
      a = k;
    }
  }
  return packLaneGraph(d, v.nodos.length >> 1);
}
