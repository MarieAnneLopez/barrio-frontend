import { describe, expect, it } from 'vitest';
import { buildAll } from './builder';
import { fakeSource, hole, square } from './fixture';
import { drain, footprintCenter, partition, partitionSteps, STEP_BUILDINGS, TILE_SIZE, volumesOf } from './tiles';

describe('teselas de edificios', () => {
  it('el respaldo en tandas: volúmenes y reparto ceden cada STEP_BUILDINGS edificios', () => {
    const n = 2 * STEP_BUILDINGS + 1;
    const source = fakeSource(Array.from({ length: n }, (_, i) => ({ rings: [square((i % 90) * 15, -Math.floor(i / 90) * 15, 10)], pisos: 1 })));
    const yields = (steps: Generator<void, unknown>) => {
      let k = 0;
      while (!steps.next().done) k++;
      return k;
    };
    expect(yields(volumesOf(source))).toBe(3);
    const volumes = drain(volumesOf(source));
    expect(yields(partitionSteps(source, volumes))).toBe(3);
    expect(drain(partitionSteps(source, volumes))).toEqual(partition(source));
  });

  it('reparte por teselas de 400 m según el centro de la huella, en orden fijo (filas, columnas)', () => {
    expect(TILE_SIZE).toBe(400);
    const source = fakeSource([
      { rings: [square(10, 10, 5)], pisos: 1 }, { rings: [square(900, 10, 5)], pisos: 1 },
      { rings: [square(30, 50, 5)], pisos: 1 }, { rings: [square(10, -500, 5)], pisos: 1 },
    ]);
    expect(footprintCenter(source, 1)).toEqual([902.5, 7.5]);
    expect(partition(source).map((p) => [p.key, p.buildings])).toEqual([['0,-2', [3]], ['0,0', [0, 2]], ['2,0', [1]]]);
    const { tiles } = buildAll(source);
    expect(tiles.map((t) => [t.key, Array.from(t.buildings)])).toEqual([['0,-2', [3]], ['0,0', [0, 2]], ['2,0', [1]]]);
    for (const t of tiles) {
      const [x0 = 0, , z0 = 0, x1 = 0, , z1 = 0] = t.bounds;
      for (let i = 0; i < t.position.length; i += 3) {
        expect((t.position[i] ?? 0) >= x0 && (t.position[i] ?? 0) <= x1).toBe(true);
        expect((t.position[i + 2] ?? 0) >= z0 && (t.position[i + 2] ?? 0) <= z1).toBe(true);
      }
    }
  });

  it('cada cara sabe su edificio: el atributo por vértice y los rangos coinciden', () => {
    const source = fakeSource([0, 1, 2, 3].map((i) => ({ rings: [square(i * 15, 0, 10)], pisos: i + 1 })));
    const [t] = buildAll(source).tiles;
    expect(Array.from(t?.buildings ?? [])).toEqual([0, 1, 2, 3]);
    expect(t?.ranges[t.ranges.length - 1]).toBe(t?.index.length);
    t?.buildings.forEach((b, k) => {
      for (let i = t.ranges[k] ?? 0; i < (t.ranges[k + 1] ?? 0); i++) expect(t.data[3 * (t.index[i] ?? 0)]).toBe(b);
    });
  });

  it('es determinista: los mismos datos dan los mismos arreglos', () => {
    const source = fakeSource([{ rings: [square(0, 0, 12), hole(2, -2, 3)], pisos: 4 }, { rings: [square(500, 0, 9)], pisos: 7 }]);
    const dump = () => buildAll(source).tiles.map((t) => [t.key, Array.from(t.position), Array.from(t.data), Array.from(t.index)]);
    expect(dump()).toEqual(dump());
    expect(buildAll(source).tiles.every((t) => t.index instanceof Uint16Array)).toBe(true); // < 65 536 vértices
  });
});
