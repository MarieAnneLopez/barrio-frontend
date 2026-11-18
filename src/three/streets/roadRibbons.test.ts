import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { makeVias } from './fixtures';
import { LEVEL, roadLevel } from './levels';
import { buildNetwork, wayTags } from './network';
import { roadSpec } from './roadClass';
import { buildRoads, REVERSE_BIT, roadGeometry } from './roadRibbons';

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

  it('los andenes van a ambos lados, más anchos que la calzada y debajo de ella', () => {
    const spec = roadSpec(wayTags(vias, 0));
    const side = vertices(sidewalks).filter((p) => p.x === -100).map((p) => Math.abs(p.across));
    expect(side).toEqual([spec.half + spec.sidewalk, spec.half + spec.sidewalk]);
    expect(vertices(sidewalks).every((p) => p.y === LEVEL.sidewalk)).toBe(true);
  });

  it('las caras miran hacia arriba', () => {
    const g = roadGeometry(asphalt);
    g.computeVertexNormals();
    const n = g.getAttribute('normal');
    for (let i = 0; i < n.count; i++) expect(n.getY(i)).toBeGreaterThan(0.99);
  });
});
