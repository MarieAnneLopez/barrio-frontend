import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { makeVias } from './fixtures';
import { buildNetwork, wayTags } from './network';
import { roadSpec } from './roadClass';
import { roadIndex } from './segmentIndex';
import { signalPoses } from './signals';

const C = TNT3.clasesVia;
// Avenida de 400 m hacia el este y una calle residencial que llega del norte en x = 200 (una T).
const base = makeVias([[0, 0], [200, 0], [400, 0], [200, -150]], [
  { nodes: [0, 1, 2], clase: C.secondary, sentido: 1 },
  { nodes: [1, 3], clase: C.residential },
]);
const net = buildNetwork(base);
const avenue = roadSpec(wayTags(base, 0));
/** Punta del brazo (la caja de luces va a 3 m del poste, models.trafficLight). */
const tip = (p: { yaw: number; x: number; z: number }) => [p.x + Math.cos(p.yaw) * 3, p.z - Math.sin(p.yaw) * 3] as const;
const at = (x: number, z: number) => {
  const vias = { ...base, semaforos: { xz: Float32Array.from([x, z]), osm: new Float64Array(1) } };
  return { poses: signalPoses(vias, roadIndex(vias, net)), roads: roadIndex(vias, net) };
};

describe('semáforos de OSM: dos postes en los andenes con el brazo sobre la calzada', () => {
  it('en medio de la avenida: dos postes enfrentados fuera de la calzada', () => {
    const { poses } = at(100, 1);
    expect(poses).toHaveLength(2);
    expect(poses.map((p) => Math.sign(p.z)).sort()).toEqual([-1, 1]);
    for (const p of poses) {
      expect(Math.abs(p.z)).toBeGreaterThan(avenue.half);
      expect(Math.abs(tip(p)[1])).toBeLessThan(avenue.half);
    }
  });

  it('en el nodo mismo del cruce: los postes van a las esquinas, fuera de las dos calzadas', () => {
    const { poses, roads } = at(200, 0);
    expect(poses).toHaveLength(2);
    for (const p of poses) {
      expect(roads.covering(p.x, p.z, 0.5)).toBeNull();
      expect(Math.hypot(p.x - 200, p.z)).toBeLessThan(12);
      expect(roads.covering(...tip(p))).not.toBeNull(); // el brazo queda sobre una calzada
    }
  });
});
