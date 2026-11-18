// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { makeVias } from '../streets/fixtures';
import { drive } from './driveCheck';
import { buildLaneGraph } from './laneGraph';
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
const NOTHING_WRONG = { wrongWay: 0, leftSide: 0, backwards: 0, jumps: 0, nan: 0, againstDrawing: 0, leftOfTravel: 0, leftInside: 0 };

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

  it('nunca recorren una vía de un sentido al revés (medido con su desplazamiento real) y en doble sentido van por la derecha', () => {
    expect(report.checked).toBeGreaterThan(10_000);
    expect(report.moved).toBeGreaterThan(10_000);
    expect(report).toMatchObject(NOTHING_WRONG);
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

  it('el grafo usa solo vías vehiculares de OSM y respeta sus sentidos, también en el movimiento real', () => {
    expect(g.edges).toBeGreaterThan(500);
    for (let e = 0; e < g.edges; e++) expect(v.clase[g.way[e] ?? 0]).toBeLessThanOrEqual(C.road);
    expect(report.checked).toBeGreaterThan(100_000);
    expect(report.moved).toBeGreaterThan(100_000);
    expect(report).toMatchObject(NOTHING_WRONG);
  });
});
