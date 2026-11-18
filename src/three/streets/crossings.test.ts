import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { allCrossingMarks, crossingMarks, ZEBRA } from './crossings';
import { makeVias } from './fixtures';
import { buildNetwork, wayTags } from './network';
import { roadSpec } from './roadClass';
import { SegmentIndex } from './segmentIndex';

const T = TNT3.cruces;

describe('cebras en los cruces reales', () => {
  it('calle a lo largo de x: las barras van a lo largo de x y se repiten de andén a andén en z', () => {
    const { white, cycle } = crossingMarks(10, 20, 0, 12, T.cebra);
    expect(cycle).toEqual([]);
    expect(white.length).toBe(Math.floor(12 / ZEBRA.period));
    for (const bar of white) {
      expect(bar.angle).toBe(0);
      expect(bar.sx).toBe(ZEBRA.strip);
      expect(bar.sz).toBe(ZEBRA.bar);
      expect(bar.x).toBeCloseTo(10);
      expect(Math.abs(bar.z - 20) + ZEBRA.bar / 2).toBeLessThanOrEqual(6 + 1e-6);
    }
    const zs = white.map((b) => b.z);
    expect((Math.min(...zs) + Math.max(...zs)) / 2).toBeCloseTo(20); // centrada en el nodo del cruce
  });

  it('calle a lo largo de z (ángulo π/2): las barras se reparten en x', () => {
    const { white } = crossingMarks(0, 0, Math.PI / 2, 8, T.marcado);
    const xs = white.map((b) => b.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(5);
    for (const bar of white) expect(Math.abs(bar.z)).toBeLessThan(1e-6);
  });

  it('sin marcas no se pinta; la ciclorruta va en su color con cuadros blancos en los bordes', () => {
    expect(crossingMarks(0, 0, 0, 10, T.sinMarcas)).toEqual({ white: [], cycle: [] });
    const { white, cycle } = crossingMarks(0, 0, 0, 10, T.ciclorruta | T.marcado | T.semaforo);
    expect(cycle).toHaveLength(1);
    expect(cycle[0]?.sz).toBe(10);
    expect(white.length).toBeGreaterThan(4);
    for (const square of white) expect(Math.abs(square.x)).toBeCloseTo(ZEBRA.cycleBand / 2);
  });

  it('largo 0: el ancho de la calzada más cercana', () => {
    const vias = makeVias([[-50, 0], [50, 0]], [{ nodes: [0, 1], clase: TNT3.clasesVia.tertiary }], {
      xz: Float32Array.from([0, 0]), tipo: Uint8Array.from([T.cebra]), angulo: Float32Array.from([0]),
      largo: Float32Array.from([0]), osm: new Float64Array(1),
    });
    const net = buildNetwork(vias);
    const { white } = allCrossingMarks(vias, new SegmentIndex(vias, net));
    expect(white.length).toBe(Math.floor(roadSpec(wayTags(vias, 0)).width / ZEBRA.period));
  });
});

describe('índice de calzadas', () => {
  const vias = makeVias([[0, 0], [100, 0], [100, 100]], [
    { nodes: [0, 1], clase: TNT3.clasesVia.residential },
    { nodes: [1, 2], clase: TNT3.clasesVia.primary, sentido: 1 },
  ]);
  const index = new SegmentIndex(vias, buildNetwork(vias));

  it('encuentra la calzada más cercana, su dirección de dibujo y su media calzada', () => {
    const hit = index.nearest(95, 50, 30);
    expect(hit?.way).toBe(1);
    expect(hit?.dz).toBeCloseTo(1);
    expect(hit?.dist).toBeCloseTo(5);
    expect(hit?.half).toBeCloseTo(roadSpec(wayTags(vias, 1)).half);
    expect(index.nearest(50, 3, 30)?.way).toBe(0);
  });

  it('nada si no hay calzada en el radio', () => {
    expect(index.nearest(500, 500, 30)).toBeNull();
  });
});
