import { TNT3, type Vias } from '../data/format';
import { cumulative, densify } from './polyline';

// Línea de un tramo con su altura: a ras de suelo, salvo los puentes (bandera `puente`), que suben
// por rampas hasta su nivel de OSM y bajan donde tocan el suelo (regla de dibujo: OSM no trae la
// altura real, solo el `layer`). Los túneles no se dibujan (roadClass).

/** Altura de un puente por nivel de OSM (m, asumida). */
export const BRIDGE_HEIGHT = 6;
/** Largo de cada rampa (m, asumido). */
export const RAMP = 30;

export interface WayLine {
  xz: Float32Array;
  cum: Float32Array;
  y: Float32Array;
  /** Nodo de la red de cada vértice (−1 en los vértices agregados para la rampa). */
  node: Int32Array;
}

const touchesCache = new WeakMap<Vias, Uint8Array>();

/** Cuántos puentes tocan cada nodo: un extremo que sigue en otro puente no baja al suelo. */
function bridgeTouches(v: Vias): Uint8Array {
  const cached = touchesCache.get(v);
  if (cached) return cached;
  const touches = new Uint8Array(v.nodos.length >> 1);
  for (let w = 0; w < v.count; w++) {
    if (!((v.banderas[w] ?? 0) & TNT3.banderasVia.puente)) continue;
    for (let i = v.tramos[w] ?? 0; i < (v.tramos[w + 1] ?? 0); i++) {
      const node = v.indices[i] ?? 0;
      touches[node] = Math.min(255, (touches[node] ?? 0) + 1);
    }
  }
  touchesCache.set(v, touches);
  return touches;
}

export const isBridge = (v: Vias, w: number) => ((v.banderas[w] ?? 0) & TNT3.banderasVia.puente) !== 0;

export function wayLine(v: Vias, w: number): WayLine {
  const [a, b] = [v.tramos[w] ?? 0, v.tramos[w + 1] ?? 0];
  const node = new Int32Array(b - a);
  const xz = new Float32Array(2 * (b - a));
  for (let i = a; i < b; i++) {
    const n = v.indices[i] ?? 0;
    node[i - a] = n;
    xz[2 * (i - a)] = v.nodos[2 * n] ?? 0;
    xz[2 * (i - a) + 1] = v.nodos[2 * n + 1] ?? 0;
  }
  if (!isBridge(v, w)) return { xz, cum: cumulative(xz), y: new Float32Array(b - a), node };
  const touches = bridgeTouches(v);
  const height = BRIDGE_HEIGHT * Math.max(1, v.nivel[w] ?? 1);
  const rampStart = (touches[node[0] ?? 0] ?? 0) < 2;
  const rampEnd = (touches[node[node.length - 1] ?? 0] ?? 0) < 2;
  const total = cumulative(xz)[node.length - 1] ?? 0;
  const ramp = Math.max(1e-3, Math.min(RAMP, rampStart && rampEnd ? total / 2 : total));
  const d = densify(xz, [ramp, total - ramp, total / 2]);
  const y = d.cum.map((s) => height * Math.min(1, rampStart ? s / ramp : 1, rampEnd ? (total - s) / ramp : 1));
  return { xz: d.xz, cum: d.cum, y, node: d.source.map((k) => (k >= 0 ? (node[k] ?? -1) : -1)) };
}
