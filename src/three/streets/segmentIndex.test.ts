import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { makeVias } from './fixtures';
import { buildNetwork, wayTags } from './network';
import { roadSpec } from './roadClass';
import { roadIndex, SegmentIndex } from './segmentIndex';

const C = TNT3.clasesVia;

describe('índice de calzadas', () => {
  // Una calle residencial al este, una primaria al sur desde su final y una primaria ancha (4 carriles)
  // paralela a la residencial, 9 m al sur.
  const vias = makeVias([[0, 0], [100, 0], [100, 100], [0, 9], [100, 9]], [
    { nodes: [0, 1], clase: C.residential },
    { nodes: [1, 2], clase: C.primary, sentido: 1 },
    { nodes: [3, 4], clase: C.primary, carriles: 4 },
  ]);
  const index = roadIndex(vias, buildNetwork(vias));

  it('encuentra la calzada más cercana, su dirección de dibujo, el punto del eje y su media calzada', () => {
    const hit = index.nearest(95, 50, 30);
    expect(hit?.way).toBe(1);
    expect(hit?.dz).toBeCloseTo(1);
    expect(hit?.dist).toBeCloseTo(5);
    expect([hit?.x, hit?.z, hit?.t]).toEqual([100, 50, 0.5]);
    expect(hit?.half).toBeCloseTo(roadSpec(wayTags(vias, 1)).half);
    expect(index.nearest(50, 3, 30)?.way).toBe(0);
  });

  it('la más cercana que cumple una condición', () => {
    expect(index.nearest(95, 3, 30)?.way).toBe(0);
    expect(index.nearest(95, 3, 30, (h) => h.way === 1)?.dist).toBeCloseTo(5);
  });

  it('qué calzada cubre un punto: la ancha aunque el eje de la angosta quede más cerca', () => {
    expect(roadSpec(wayTags(vias, 2)).half).toBe(7);
    expect(index.nearest(50, 3.5, 30)?.way).toBe(0);
    expect(index.covering(50, 3.5)?.way).toBe(2);
    expect(index.covering(50, -3.5)).toBeNull();
    expect(index.covering(50, -3.5, 1)?.way).toBe(0);
  });

  it('nada si no hay calzada en el radio; los puentes no entran en el de calzadas a ras de suelo', () => {
    expect(index.nearest(500, 500, 30)).toBeNull();
    const bridge = makeVias([[0, 0], [100, 0]], [{ nodes: [0, 1], clase: C.primary, banderas: TNT3.banderasVia.puente }]);
    expect(roadIndex(bridge, buildNetwork(bridge)).nearest(50, 0, 30)).toBeNull();
    const reach4 = new SegmentIndex(bridge, () => 4);
    expect(reach4.covering(50, 3.9)?.half).toBe(4);
    expect(reach4.covering(50, 4.1)).toBeNull();
  });
});
