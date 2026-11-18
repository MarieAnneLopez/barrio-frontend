import type { LaneGraph } from './laneGraph';
import type { Traffic } from './traffic';

// Frenado detrás del carro de adelante en la misma arista y carril: los carros no se atraviesan.
// Listas enlazadas por arista en arreglos reutilizados (nada de objetos nuevos por cuadro).

/** Distancia entre centros (m) a la que se empieza a frenar y a la que se queda quieto. */
export const FOLLOW_GAP = 15;
export const STOP_GAP = 7.5;

const heads = new WeakMap<LaneGraph, Int32Array>();
const links = new WeakMap<Traffic, Int32Array>();

export function following(g: LaneGraph, tr: Traffic, active: number): void {
  const head = heads.get(g) ?? new Int32Array(g.edges);
  heads.set(g, head);
  const link = links.get(tr) ?? new Int32Array(tr.s.length);
  links.set(tr, link);
  head.fill(-1);
  for (let i = 0; i < active; i++) {
    if (tr.turning[i]) continue;
    const e = tr.edge[i] ?? 0;
    link[i] = head[e] ?? -1;
    head[e] = i;
  }
  for (let i = 0; i < active; i++) {
    tr.limit[i] = 1;
    if (tr.turning[i]) continue;
    let gap = Infinity;
    for (let j = head[tr.edge[i] ?? 0] ?? -1; j >= 0; j = link[j] ?? -1) {
      if (j === i || tr.lane[j] !== tr.lane[i]) continue;
      const d = (tr.s[j] ?? 0) - (tr.s[i] ?? 0);
      if (d > 0 && d < gap) gap = d;
    }
    if (gap < FOLLOW_GAP) tr.limit[i] = Math.min(1, Math.max(0, (gap - STOP_GAP) / (FOLLOW_GAP - STOP_GAP)));
  }
}
