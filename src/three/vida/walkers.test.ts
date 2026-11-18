// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { realSuelo, realVias } from '../../test/tintalReal';
import { TNT3 } from '../data/format';
import { makeSuelo, makeVias } from '../streets/fixtures';
import { LEVEL } from '../streets/levels';
import { STROLL_Y } from './strolls';
import { buildWalkPaths, type WalkPaths } from './walkPaths';
import { createWalkers, frameWalkers, stepWalkers } from './walkers';

const C = TNT3.clasesVia;
// Dos calles residenciales (calzada de 6 m, andenes de 2 m) que se cruzan en (100, 0), un sendero y
// una ciclorruta (sin gente).
const vias = makeVias([[0, 0], [100, 0], [200, 0], [100, -100], [100, 100], [200, 100]], [
  { nodes: [0, 1, 2], clase: C.residential },
  { nodes: [3, 1, 4], clase: C.residential },
  { nodes: [2, 5], clase: C.footway },
  { nodes: [5, 4], clase: C.cycleway },
]);
const park = makeSuelo([[TNT3.clasesSuelo.park, [[300, 200, 400, 200, 400, 300, 300, 300]]]]);

/** Distancia del punto al camino p (segmentos). */
function distanceToPath(p: WalkPaths, path: number, x: number, z: number): number {
  let best = Infinity;
  for (let i = p.start[path] ?? 0; i + 1 < (p.start[path + 1] ?? 0); i++) {
    const [ax, az, bx, bz] = [p.xz[2 * i] ?? 0, p.xz[2 * i + 1] ?? 0, p.xz[2 * i + 2] ?? 0, p.xz[2 * i + 3] ?? 0];
    const l2 = (bx - ax) ** 2 + (bz - az) ** 2 || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / l2));
    best = Math.min(best, Math.hypot(x - ax - t * (bx - ax), z - az - t * (bz - az)));
  }
  return best;
}

describe('caminos de las personitas', () => {
  const paths = buildWalkPaths(vias, park);
  const level = (i: number) => (paths.y[i] ?? 0).toFixed(2);

  it('senderos de OSM, los andenes de cada calle y paseos dentro de los parques; sin ciclorrutas', () => {
    expect(new Set(Array.from(paths.y, (y) => y.toFixed(2)))).toEqual(new Set([LEVEL.foot, LEVEL.sidewalk, STROLL_Y].map((y) => y.toFixed(2))));
    expect(paths.count).toBeGreaterThanOrEqual(1 + 2 * 4 + 1); // sendero, 2 andenes × 4 brazos del cruce, parque
    for (let i = 0; i < paths.y.length; i++) {
      const [x, z] = [paths.xz[2 * i] ?? 0, paths.xz[2 * i + 1] ?? 0];
      if (level(i) === STROLL_Y.toFixed(2)) expect(x > 300 && x < 400 && z > 200 && z < 300).toBe(true);
      // Los andenes van por el medio del andén (a 4 m del eje) y se cortan antes de la otra calzada.
      if (level(i) === LEVEL.sidewalk.toFixed(2)) {
        expect(Math.abs(z) < 3 || Math.abs(x - 100) < 3).toBe(false);
        expect(Math.min(Math.abs(Math.abs(z) - 4), Math.abs(Math.abs(x - 100) - 4))).toBeLessThan(1e-3);
      }
    }
  });

  it('caminan sobre su camino, un poco a la derecha, y dan la vuelta al llegar al final', () => {
    const people = createWalkers(paths, 200);
    for (let k = 0; k < 2000; k++) {
      stepWalkers(paths, people, 200, 0.1, k * 0.1, false);
      for (let i = 0; i < 200; i += 7) {
        const path = people.path[i] ?? 0;
        const away = distanceToPath(paths, path, people.x[i] ?? 0, people.z[i] ?? 0);
        expect(away).toBeLessThanOrEqual(0.35 * (paths.width[path] ?? 0) + 1e-3);
        expect(people.s[i]).toBeGreaterThanOrEqual(0);
        expect(people.s[i]).toBeLessThanOrEqual((paths.length[path] ?? 0) + 1e-4);
      }
    }
    expect(new Set(Array.from(people.dir)).size).toBe(2);
    expect(Array.from(people.roll).some((r) => Math.abs(r) > 0.01)).toBe(true);
  });

  it('con movimiento reducido quedan de pie y quietas', () => {
    const people = createWalkers(paths, 50);
    const before = Array.from(people.x);
    stepWalkers(paths, people, 50, 0.5, 3, true);
    expect(Array.from(people.x)).toEqual(before);
    expect(Array.from(people.roll).every((r) => r === 0)).toBe(true);
  });

  it('si se activa en caliente a mitad de un paso, el primer cuadro quieto las pone de pie y los demás no escriben', () => {
    const people = createWalkers(paths, 50);
    for (let k = 0; k < 5; k++) expect(frameWalkers(paths, people, 50, 0.1, 0.37 * k, false)).toBe(true);
    expect(Array.from(people.roll).some((r) => Math.abs(r) > 0.01)).toBe(true);
    expect(frameWalkers(paths, people, 50, 0.1, 2, true)).toBe(true);
    expect(Array.from(people.roll).every((r) => r === 0)).toBe(true);
    expect(frameWalkers(paths, people, 50, 0.1, 2.1, true)).toBe(false);
    expect(frameWalkers(paths, people, 40, 0.1, 2.2, true)).toBe(true); // cambió cuántas se dibujan
  });
});

describe('caminos con los datos reales', async () => {
  const paths = buildWalkPaths(await realVias(), await realSuelo());

  it('hay andenes, senderos y parques para cientos de personas', () => {
    expect(paths.count).toBeGreaterThan(500);
    const people = createWalkers(paths, 760);
    stepWalkers(paths, people, 760, 0.1, 1, false);
    expect(Array.from(people.x).every(Number.isFinite)).toBe(true);
  });
});
