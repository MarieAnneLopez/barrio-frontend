// @vitest-environment node
// Anillos: multipolígonos de OSM armados con sus vías miembro y limpieza para el formato
// (decímetros, sin vértices repetidos, exterior antihorario y huecos horarios).
import { describe, expect, it } from 'vitest';
import { signedArea } from './geo.mjs';
import { cleanPolygon, joinWays, multipolygon } from './rings.mjs';

describe('joinWays', () => {
  it('une tramos por sus extremos, aunque vengan al revés, y cierra el anillo', () => {
    const rings = joinWays([
      [[0, 0], [10, 0], [10, -10]],
      [[0, 0], [0, -10]], // al revés
      [[10, -10], [0, -10]],
    ]);
    expect(rings).toHaveLength(1);
    expect(rings[0]).toHaveLength(4);
    expect(Math.abs(signedArea(rings[0]))).toBe(100);
  });

  it('descarta lo que no cierra', () => {
    expect(joinWays([[[0, 0], [10, 0]], [[50, 50], [60, 50]]])).toEqual([]);
  });
});

describe('multipolygon', () => {
  it('asigna cada hueco al exterior que lo contiene', () => {
    const polygons = multipolygon([
      { role: 'outer', points: [[0, 0], [100, 0], [100, -100], [0, -100], [0, 0]] },
      { role: 'outer', points: [[200, 0], [210, 0], [210, -10], [200, 0]] },
      { role: 'inner', points: [[40, -40], [60, -40], [60, -60], [40, -60], [40, -40]] },
    ]);
    expect(polygons.map((p) => p.length)).toEqual([2, 1]);
  });
});

describe('cleanPolygon', () => {
  it('redondea a decímetros, quita repetidos y el cierre, y orienta exterior y huecos', () => {
    const cw = [[0, 0], [0, -10], [0.04, -10.02], [10, -10], [10, 0], [0, 0]];
    const ccwHole = [[3, -3], [7, -3], [7, -7], [3, -7]];
    const [outer, hole] = cleanPolygon([cw, ccwHole]);
    expect(outer).toEqual([[0, 0], [10, 0], [10, -10], [0, -10]]);
    expect(signedArea(outer)).toBeGreaterThan(0);
    expect(signedArea(hole)).toBeLessThan(0);
  });

  it('un exterior sin área queda fuera; un hueco degenerado se ignora', () => {
    expect(cleanPolygon([[[0, 0], [5, 0], [10, 0]]])).toBeNull();
    expect(cleanPolygon([[[0, 0], [10, 0], [10, -10]], [[1, -1], [1.01, -1]]])).toHaveLength(1);
  });
});
