// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { TNT3, type Vias } from '../data/format';
import { makeVias } from '../streets/fixtures';
import { buildLaneGraph, type LaneGraph } from './laneGraph';
import { createTraffic, stepTraffic, type Traffic } from './traffic';
import { edgePose } from './trafficPose';
import { realVias } from '../../test/tintalReal';

const C = TNT3.clasesVia;
// Anillo de 400 × 200 m: arriba de un sentido a favor del dibujo (al este), abajo de un sentido EN
// CONTRA del dibujo (se dibujó al este, se anda al oeste), a la izquierda de un sentido al norte y a
// la derecha y por el medio, doble sentido.
const loop = makeVias([[0, 0], [200, 0], [400, 0], [0, 200], [200, 200], [400, 200]], [
  { nodes: [0, 1, 2], clase: C.primary, sentido: 1 },
  { nodes: [3, 4, 5], clase: C.secondary, sentido: -1 },
  { nodes: [2, 5], clase: C.residential },
  { nodes: [3, 0], clase: C.residential, sentido: 1 },
  { nodes: [1, 4], clase: C.residential },
]);

/**
 * Corre la simulación y revisa en cada paso: sentido de la arista (wrongWay), carril a la derecha en
 * doble sentido (leftSide), avance siempre hacia adelante en su arista (backwards) y que cada cambio
 * de arista pase por una que sale del nodo donde terminó la anterior (jumps). Las reapariciones (en
 * una calle sin salida o en el borde) no cuentan como movimiento.
 */
function drive(v: Vias, g: LaneGraph, cars: number, steps: number, dt = 0.1) {
  const tr: Traffic = createTraffic(g, cars);
  const center = [0, 0, 0, 0, 0];
  const report = { wrongWay: 0, leftSide: 0, backwards: 0, jumps: 0, checked: 0, nan: 0 };
  for (let k = 0; k < steps; k++) {
    const before = Array.from({ length: cars }, (_, i) => [tr.edge[i] ?? 0, tr.s[i] ?? 0, tr.age[i] ?? 0] as const);
    stepTraffic(g, tr, cars, dt);
    for (let i = 0; i < cars; i++) {
      if (!Number.isFinite(tr.x[i]) || !Number.isFinite(tr.z[i])) report.nan += 1;
      const [edge0, s0, age0] = before[i] ?? [0, 0, 0];
      const respawned = (tr.age[i] ?? 0) < age0;
      const e = tr.edge[i] ?? 0;
      if (!respawned && e !== edge0 && g.from[e] !== g.to[edge0]) report.jumps += 1;
      if (!respawned && e === edge0 && !tr.turning[i] && (tr.s[i] ?? 0) < s0 - 1e-4) report.backwards += 1;
      if (tr.turning[i]) continue;
      const sentido = v.sentido[g.way[e] ?? 0] ?? 0;
      report.checked += 1;
      if ((sentido === 1 && !g.forward[e]) || (sentido === -1 && g.forward[e])) report.wrongWay += 1;
      edgePose(g, e, tr.s[i] ?? 0, 0, center);
      const side = ((tr.x[i] ?? 0) - (center[0] ?? 0)) * -(center[4] ?? 0) + ((tr.z[i] ?? 0) - (center[2] ?? 0)) * (center[3] ?? 0);
      if (sentido === 0 && side <= 0) report.leftSide += 1;
    }
  }
  return { tr, report };
}

describe('grafo de carriles sobre la red real', () => {
  const g = buildLaneGraph(loop);

  it('una arista por sentido permitido: SENT 1 a favor, −1 en contra, 0 las dos con su gemela', () => {
    const byWay = (w: number) => Array.from({ length: g.edges }, (_, e) => e).filter((e) => g.way[e] === w);
    expect(byWay(0).every((e) => g.forward[e] === 1)).toBe(true);
    expect(byWay(1).every((e) => g.forward[e] === 0)).toBe(true);
    const twoWay = byWay(2);
    expect(twoWay).toHaveLength(2);
    expect(g.reverse[twoWay[0] ?? 0]).toBe(twoWay[1]);
  });

  it('los nodos compartidos unen las aristas: del final de una salen las siguientes', () => {
    for (let e = 0; e < g.edges; e++) {
      const node = g.to[e] ?? -1;
      for (let k = g.outFirst[node] ?? 0; k < (g.outFirst[node + 1] ?? 0); k++) expect(g.from[g.outList[k] ?? 0]).toBe(node);
    }
  });
});

describe('carros por el anillo de prueba', () => {
  const g = buildLaneGraph(loop);
  const { tr, report } = drive(loop, g, 60, 1500);

  it('nunca recorren una vía de un sentido al revés y en doble sentido van por la derecha', () => {
    expect(report.checked).toBeGreaterThan(10_000);
    expect(report).toMatchObject({ wrongWay: 0, leftSide: 0, backwards: 0, jumps: 0, nan: 0 });
  });

  it('giran en los cruces: pasan por todas las vías del anillo', () => {
    const ways = new Set(Array.from(tr.edge, (e) => g.way[e]));
    expect(ways.size).toBeGreaterThanOrEqual(4);
  });
});

describe('carros por la red real de El Tintal', async () => {
  const v = await realVias();
  const g = buildLaneGraph(v);
  const { report } = drive(v, g, 300, 600, 0.12);

  it('el grafo usa solo vías vehiculares de OSM y respeta sus sentidos', () => {
    expect(g.edges).toBeGreaterThan(500);
    for (let e = 0; e < g.edges; e++) expect(v.clase[g.way[e] ?? 0]).toBeLessThanOrEqual(C.road);
    expect(report.checked).toBeGreaterThan(100_000);
    expect(report).toMatchObject({ wrongWay: 0, leftSide: 0, backwards: 0, jumps: 0, nan: 0 });
  });
});
