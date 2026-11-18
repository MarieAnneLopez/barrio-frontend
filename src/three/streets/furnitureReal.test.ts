// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { realVias } from '../../test/tintalReal';
import { allCrossingMarks } from './crossings';
import { lampPoses } from './lamps';
import { buildNetwork } from './network';
import { roadIndex } from './segmentIndex';
import { signalPoses } from './signals';

// Cebras, semáforos y faroles con los datos reales de El Tintal (TNT3, OSM).

describe('mobiliario de las calles con los datos reales', async () => {
  const v = await realVias();
  const net = buildNetwork(v);
  const roads = roadIndex(v, net);
  /** ¿El punto cae sobre una calzada o su andén? */
  const onStreet = (x: number, z: number) => {
    const hit = roads.nearest(x, z, 30);
    return hit !== null && hit.dist <= hit.half + (net.specs[hit.way]?.sidewalk ?? 0) + 0.5;
  };

  it('toda marca de cruce cae sobre una calzada o su andén, y cada cebra mide lo que su calzada', () => {
    const { white, cycle } = allCrossingMarks(v, roads);
    expect(white.length).toBeGreaterThan(500);
    expect(white.filter((m) => !onStreet(m.x, m.z))).toEqual([]);
    expect(cycle.filter((m) => !onStreet(m.x, m.z))).toEqual([]);
    for (const band of cycle) expect(band.sz).toBeLessThanOrEqual(2 * (roads.nearest(band.x, band.z, 1)?.half ?? 0) + 1e-3);
  });

  it('ningún poste de semáforo queda sobre una calzada (tampoco la del cruce) y casi todos tienen sus dos', () => {
    const poles = signalPoses(v, roads);
    expect(poles.filter((p) => roads.covering(p.x, p.z, 0.5))).toEqual([]);
    expect(poles.length).toBeGreaterThanOrEqual(0.95 * v.semaforos.xz.length);
  });

  it('ningún farol decorativo queda sobre otra calzada', () => {
    const lamps = lampPoses(v, net, roads);
    expect(lamps.length).toBeGreaterThan(400);
    expect(lamps.filter((l) => roads.covering(l.x, l.z, 0.3))).toEqual([]);
  });
});
