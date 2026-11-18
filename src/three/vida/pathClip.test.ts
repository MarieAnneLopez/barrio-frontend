// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { realEdificios, realSuelo, realVias } from '../../test/tintalReal';
import { TNT3 } from '../data/format';
import { footprints } from '../streets/footprints';
import { makeEdificios, makeSuelo, makeVias } from '../streets/fixtures';
import { clipOutside, footprintWalls, WALL_GAP } from './pathClip';
import type { PathDraft } from './pathPack';
import { buildWalkPaths, type WalkPaths } from './walkPaths';

const rect = (x0: number, z0: number, x1: number, z1: number) => [x0, z0, x1, z0, x1, z1, x0, z1];
/** Un edificio de 20 × 20 m: x ∈ [40, 60], z ∈ [−10, 10]. */
const walls = footprintWalls(makeEdificios([[rect(40, -10, 60, 10)]]));
const path = (xz: number[]): PathDraft => ({ xz, y: new Array<number>(xz.length / 2).fill(0), weight: 1, width: 2 });
const close = (actual: number[] | undefined, expected: number[]) => {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((v, i) => expect(actual?.[i]).toBeCloseTo(v, 5));
};

/** Muestras cada `step` m de todos los caminos. */
function samples(p: WalkPaths, step: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < p.count; i++) {
    for (let k = p.start[i] ?? 0; k + 1 < (p.start[i + 1] ?? 0); k++) {
      const [ax, az, bx, bz] = [p.xz[2 * k] ?? 0, p.xz[2 * k + 1] ?? 0, p.xz[2 * k + 2] ?? 0, p.xz[2 * k + 3] ?? 0];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
      for (let j = 0; j <= n; j++) out.push([ax + ((bx - ax) * j) / n, az + ((bz - az) * j) / n]);
    }
  }
  return out;
}

describe('los caminos de las personitas no atraviesan edificios', () => {
  it('una recta que pasa por un edificio se parte en dos, a WALL_GAP m de cada pared', () => {
    const [a, b, ...rest] = clipOutside({ xz: [0, 0, 100, 0], y: [0.1, 0.3], weight: 1, width: 2 }, walls);
    expect(rest).toEqual([]);
    close(a?.xz, [0, 0, 40 - WALL_GAP, 0]);
    close(b?.xz, [60 + WALL_GAP, 0, 100, 0]);
    close([a?.y[0] ?? NaN, b?.y[1] ?? NaN], [0.1, 0.3]);
    expect([a?.weight, b?.width]).toEqual([1, 2]);
  });

  it('si dobla dentro del edificio, sigue por fuera después de la otra pared con sus quiebres', () => {
    const [a, b, ...rest] = clipOutside(path([30, 0, 50, 0, 50, 30, 80, 30]), walls);
    expect(rest).toEqual([]);
    close(a?.xz, [30, 0, 40 - WALL_GAP, 0]);
    close(b?.xz, [50, 10 + WALL_GAP, 50, 30, 80, 30]);
  });

  it('lo de fuera queda igual, los trozos cortos se descartan y bajo un voladizo sí se pasa', () => {
    close(clipOutside(path([0, 30, 20, 30, 20, 50]), walls)[0]?.xz, [0, 30, 20, 30, 20, 50]);
    expect(clipOutside(path([38, 0, 62, 0]), walls)).toEqual([]);
    const overhang = footprintWalls(makeEdificios([[rect(40, -10, 60, 10)]], [2]));
    close(clipOutside(path([0, 0, 100, 0]), overhang)[0]?.xz, [0, 0, 100, 0]);
  });

  it('una calle con un edificio sobre su andén: nadie camina por dentro de la huella', () => {
    const vias = makeVias([[0, 0], [100, 0]], [{ nodes: [0, 1], clase: TNT3.clasesVia.residential }]);
    const edificios = makeEdificios([[rect(40, -6, 60, -2)]]);
    const all = samples(buildWalkPaths(vias, makeSuelo([]), edificios), 0.5);
    expect(all.some(([x, z]) => z < 0 && x < 40)).toBe(true);
    expect(all.filter(([x, z]) => x > 40 - WALL_GAP / 2 && x < 60 + WALL_GAP / 2 && z > -6 && z < -2)).toEqual([]);
    expect(all.some(([x, z]) => x > 40 && x < 60 && z > 0)).toBe(true); // el andén del otro lado sigue
  });

  it('con los datos reales, ninguna muestra cada 2 m queda dentro de un edificio a ras de suelo', async () => {
    const [vias, suelo, edificios] = await Promise.all([realVias(), realSuelo(), realEdificios()]);
    const paths = buildWalkPaths(vias, suelo, edificios);
    expect(paths.count).toBeGreaterThan(500);
    const grid = footprints(edificios);
    const groundFloor = (b: number) => (edificios.base[b] ?? 0) === 0;
    expect(samples(paths, 2).filter(([x, z]) => grid.contains(x, z, groundFloor)).length).toBe(0);
  });
});
