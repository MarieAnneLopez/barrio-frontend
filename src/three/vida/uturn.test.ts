// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { makeVias } from '../streets/fixtures';
import { buildLaneGraph } from './laneGraph';
import { createTraffic, stepTraffic } from './traffic';
import { bezierAt, turnCurve } from './turns';

const C = TNT3.clasesVia;
// Un anillo cerrado de 400 × 200 m (sin salidas) y una calle sin salida de 150 m hacia el norte
// (z < 0) desde (200, 0): interna o, con `recortada`, cortada en el borde del barrio.
const DEAD_END = 5;
const spur = (banderas = 0) => makeVias([[0, 0], [200, 0], [400, 0], [400, 200], [0, 200], [200, -150]], [
  { nodes: [0, 1, 2, 3], clase: C.secondary },
  { nodes: [3, 4, 0], clase: C.secondary },
  { nodes: [1, DEAD_END], clase: C.residential, banderas },
]);

/** Corre 40 carros y cuenta vueltas en U al final de la calle, reapariciones y dónde reaparecen. */
function run(banderas: number) {
  const g = buildLaneGraph(spur(banderas));
  const into = Array.from({ length: g.edges }, (_, e) => e).find((e) => g.to[e] === DEAD_END) ?? -1;
  const back = g.reverse[into] ?? -1;
  const tr = createTraffic(g, 40);
  const out = { uturns: 0, respawns: 0, elsewhere: 0, beyond: 0 };
  for (let k = 0; k < 4000; k++) {
    const [edge, age] = [Array.from(tr.edge), Array.from(tr.age)];
    stepTraffic(g, tr, 40, 0.1);
    for (let i = 0; i < 40; i++) {
      if ((tr.age[i] ?? 0) < (age[i] ?? 0)) {
        out.respawns += 1;
        if (tr.edge[i] !== back || Math.abs((tr.s[i] ?? 0) - (g.trimStart[back] ?? 0)) > 1e-4) out.elsewhere += 1;
      } else if (edge[i] === into && tr.edge[i] === back) out.uturns += 1;
      if ((tr.z[i] ?? 0) < -150) out.beyond += 1; // más allá del final de la calle
    }
  }
  return out;
}

describe('calles sin salida', () => {
  it('en una interna dan la vuelta en U, sin pasarse del final ni reaparecer en otra vía', () => {
    const r = run(0);
    expect(r.uturns).toBeGreaterThan(5);
    expect([r.respawns, r.beyond]).toEqual([0, 0]);
  });

  it('en el extremo recortado (borde del barrio) salen de la escena y quien reaparece entra por ahí', () => {
    const r = run(TNT3.banderasVia.recortada);
    expect(r.respawns).toBeGreaterThan(5);
    expect([r.uturns, r.elsewhere]).toEqual([0, 0]);
  });

  it('la curva de la vuelta en U sale hacia adelante y vuelve por el otro lado sin cruzar de lado a lado', () => {
    const curve = new Float32Array(6);
    turnCurve(0, 0, 1, 0, 0, 3, -1, 0, curve, 0); // de (0, 0) al este a (0, 3) al oeste
    const p = [0, 0, 0, 0];
    bezierAt(curve, 0, 0, p);
    expect(Math.abs(Math.atan2(p[3] ?? 0, p[2] ?? 0))).toBeLessThan(0.35); // sale casi derecho
    const xs = Array.from({ length: 11 }, (_, k) => (bezierAt(curve, 0, k / 10, p), p[0] ?? 0));
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(-1e-6);
    expect(Math.max(...xs)).toBeGreaterThan(1.5);
  });
});
