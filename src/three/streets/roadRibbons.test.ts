import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { makeVias } from './fixtures';
import { LEVEL, roadLevel, sidewalkLevel } from './levels';
import { buildNetwork, wayTags } from './network';
import { roadSpec } from './roadClass';
import { buildRoads, REVERSE_BIT, roadGeometry, SIDEWALK_CORNER } from './roadRibbons';

const C = TNT3.clasesVia;
const vias = makeVias([[0, 0], [-100, 0], [100, 0], [0, -100], [0, 100]], [
  { nodes: [1, 0, 2], clase: C.primary, sentido: 1 },
  { nodes: [3, 0], clase: C.residential },
  { nodes: [0, 4], clase: C.residential, sentido: -1 },
  { nodes: [3, 2], clase: C.footway },
]);
const { asphalt, sidewalks } = buildRoads(vias, buildNetwork(vias));
const vertices = (b: typeof asphalt) => Array.from({ length: b.position.length / 3 }, (_, i) => ({
  x: b.position[3 * i] ?? 0, y: b.position[3 * i + 1] ?? 0, z: b.position[3 * i + 2] ?? 0,
  along: b.road[4 * i] ?? 0, across: b.road[4 * i + 1] ?? 0, style: b.meta[4 * i] ?? 0,
  back: b.meta[4 * i + 2] ?? 0, ahead: b.meta[4 * i + 3] ?? 0,
}));

describe('calzadas y andenes', () => {
  it('la avenida se parte en el cruce: 2 trozos (4 triángulos); cada calle, 1 trozo; la peatonal no va', () => {
    expect(asphalt.index.length / 3).toBe(4 + 2 + 2);
  });

  it('ancho de la regla y altura por rango: la avenida queda encima de las calles', () => {
    const avenue = roadSpec(wayTags(vias, 0));
    const atNode1 = vertices(asphalt).filter((p) => p.x === -100);
    expect(atNode1.map((p) => p.z).sort((a, b) => a - b)).toEqual([-avenue.half, avenue.half]);
    expect(atNode1[0]?.y).toBeCloseTo(roadLevel(avenue.rank));
    const street = vertices(asphalt).find((p) => p.z === -100);
    expect(street?.y).toBeCloseTo(roadLevel(roadSpec(wayTags(vias, 1)).rank));
    expect(roadLevel(avenue.rank)).toBeGreaterThan(street?.y ?? Infinity);
  });

  it('las marcas de la calle se apartan del cruce la mitad de la avenida; las de la avenida no', () => {
    const avenueHalf = roadSpec(wayTags(vias, 0)).half;
    const streetAtJunction = vertices(asphalt).filter((p) => Math.abs(p.z) < 1e-6 && Math.abs(p.x) < 5 && p.style !== roadSpec(wayTags(vias, 0)).style);
    expect(streetAtJunction.length).toBeGreaterThan(0);
    for (const p of streetAtJunction) expect(Math.min(p.back, p.ahead)).toBeCloseTo(-avenueHalf);
    const avenueAtJunction = vertices(asphalt).filter((p) => p.x === 0 && Math.abs(p.z) <= 6 && p.style === roadSpec(wayTags(vias, 0)).style);
    for (const p of avenueAtJunction) expect(Math.min(p.back, p.ahead)).toBeCloseTo(0);
  });

  it('la vía de un sentido en contra del dibujo lleva el bit de reversa', () => {
    expect(vertices(asphalt).some((p) => p.style >= REVERSE_BIT)).toBe(true);
  });

  it('los andenes van a ambos lados, más anchos que la calzada y debajo de toda calzada', () => {
    const spec = roadSpec(wayTags(vias, 0));
    const side = vertices(sidewalks).filter((p) => p.x === -100).map((p) => Math.abs(p.across));
    expect(side).toEqual([spec.half + spec.sidewalk, spec.half + spec.sidewalk]);
    expect(vertices(sidewalks).every((p) => p.y >= LEVEL.sidewalk && p.y < roadLevel(0))).toBe(true);
  });

  it('dos andenes que se solapan no quedan en el mismo plano: el de la calle mayor encima, y por vía', () => {
    for (let rank = 0; rank < 6; rank++) {
      for (let w = 0; w < 50; w++) expect(sidewalkLevel(rank, w)).toBeLessThan(sidewalkLevel(rank + 1, w + 1 + (w % 3)));
    }
    expect(sidewalkLevel(6, 7)).toBeLessThan(roadLevel(0));
    const y = (pick: (p: ReturnType<typeof vertices>[number]) => boolean) => vertices(sidewalks).find(pick)?.y ?? NaN;
    const [avenue, north, south] = [y((p) => p.x === -100), y((p) => p.z === -100), y((p) => p.z === 100)];
    expect(avenue).toBeGreaterThan(Math.max(north, south));
    expect(north).not.toBe(south); // calles del mismo rango: unos milímetros por vía
  });

  it('el bordillo y el brillo del andén se apagan en la esquina con una calle igual o mayor, no en las menores', () => {
    // En el cruce (0, 0): los andenes de las dos calles tienen sus vértices en x = ±5; los de la avenida, en x = 0.
    const streets = vertices(sidewalks).filter((p) => p.z === 0 && p.x !== 0);
    expect(streets).toHaveLength(4);
    const avenueHalf = roadSpec(wayTags(vias, 0)).half;
    for (const p of streets) expect(Math.min(p.back, p.ahead)).toBeCloseTo(-avenueHalf - SIDEWALK_CORNER);
    const avenue = vertices(sidewalks).filter((p) => p.x === 0);
    expect(avenue).toHaveLength(4);
    for (const p of avenue) expect(Math.min(p.back, p.ahead)).toBeGreaterThan(50);
  });

  it('las caras miran hacia arriba', () => {
    const g = roadGeometry(asphalt);
    g.computeVertexNormals();
    const n = g.getAttribute('normal');
    for (let i = 0; i < n.count; i++) expect(n.getY(i)).toBeGreaterThan(0.99);
  });
});
