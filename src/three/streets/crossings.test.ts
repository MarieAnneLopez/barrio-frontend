import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { allCrossingMarks, crossingMarks, ZEBRA } from './crossings';
import { makeVias } from './fixtures';
import { buildNetwork, wayTags } from './network';
import { roadSpec } from './roadClass';
import { roadIndex } from './segmentIndex';

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

});

/** Terciaria a lo largo de x (z = 0) y residencial a lo largo de z (x = 200), con los cruces dados. */
function streets(cruces: Array<[x: number, z: number, tipo: number, angulo: number, largo: number]>) {
  const vias = makeVias([[-100, 0], [100, 0], [200, -100], [200, 100]], [
    { nodes: [0, 1], clase: TNT3.clasesVia.tertiary },
    { nodes: [2, 3], clase: TNT3.clasesVia.residential },
  ], {
    xz: Float32Array.from(cruces.flatMap((c) => [c[0], c[1]])), tipo: Uint8Array.from(cruces.map((c) => c[2])),
    angulo: Float32Array.from(cruces.map((c) => c[3])), largo: Float32Array.from(cruces.map((c) => c[4])),
    osm: new Float64Array(cruces.length),
  });
  return { ...allCrossingMarks(vias, roadIndex(vias, buildNetwork(vias))), width: roadSpec(wayTags(vias, 0)).width };
}

describe('cada cebra cruza su calzada de andén a andén (FORMATO §4)', () => {
  it('con largo 0 o con el largo de una vía de cruce que pasa por varias calzadas: el ancho de la calzada', () => {
    for (const largo of [0, 96]) {
      const { white, width } = streets([[0, 0, T.cebra, 0, largo]]);
      expect(white.length).toBe(Math.floor(width / ZEBRA.period));
      for (const bar of white) expect(Math.abs(bar.z) + ZEBRA.bar / 2).toBeLessThanOrEqual(width / 2 + 1e-6);
    }
  });

  it('el punto medio de una vía de cruce (deVia) se lleva al eje de la calzada que cruza', () => {
    const { white } = streets([[10, 4, T.cebra | T.deVia, 0, 12]]);
    const zs = white.map((b) => b.z);
    expect((Math.min(...zs) + Math.max(...zs)) / 2).toBeCloseTo(0);
    expect(white.every((b) => Math.abs(b.x - 10) < 1e-6)).toBe(true);
  });

  it('sin una calzada a su alcance no se pinta; dos cruces en el mismo punto de la calzada, una vez', () => {
    expect(streets([[10, 20, T.cebra | T.deVia, 0, 5]]).white).toEqual([]);
    const once = streets([[0, 0, T.cebra, 0, 0]]).white.length;
    expect(streets([[0, 0, T.cebra, 0, 0], [0.5, 3, T.cebra | T.deVia, 0, 10]]).white).toHaveLength(once);
  });

  it('sin eje (sinEje) o con un ángulo que no va con ninguna calzada: toma la dirección de la calzada', () => {
    for (const [tipo, angulo] of [[T.cebra | T.sinEje, 0], [T.marcado, 0.1]] as const) {
      const { white } = streets([[200, 0, tipo, angulo, 0]]);
      expect(white.length).toBeGreaterThan(2);
      for (const bar of white) expect(bar.angle).toBeCloseTo(Math.PI / 2);
      expect(new Set(white.map((b) => b.x.toFixed(2))).size).toBe(white.length); // se repiten a lo ancho (x)
    }
  });
});
