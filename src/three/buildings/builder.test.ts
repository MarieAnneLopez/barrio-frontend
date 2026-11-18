import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { buildAll, DEFAULT_OPTIONS } from './builder';
import { fakeSource, hole, square } from './fixture';
import type { TileData } from './protocol';
import { faceCovers, faceNormal, faceVertices, triangleCount, vertexY } from './tileProbe';
import { LEVEL_HEIGHT } from './volume';

const H = LEVEL_HEIGHT;
const P = DEFAULT_OPTIONS.parapet;
const only = (t: TileData[]) => t[0] as TileData;
const round = (v: number) => Math.round(v * 1000) / 1000;

describe('constructor de edificios: geometría', () => {
  it('cuadrado de 2 pisos: 10 vértices y 8 triángulos de muro, 4 y 2 de techo', () => {
    const { tiles, stats } = buildAll(fakeSource([{ rings: [square(0, 0, 10)], pisos: 2 }]));
    const t = only(tiles);
    expect([t.position.length / 3, triangleCount(t)]).toEqual([14, 10]);
    expect(stats).toMatchObject({ buildings: 1, tiles: 1, vertices: 14, triangles: 10 });
    const ys = new Set(Array.from({ length: 14 }, (_, v) => round(vertexY(t, v))));
    expect(ys).toEqual(new Set([0, round(2 * H), round(2 * H - P)]));
  });

  it('el techo mira hacia arriba y los muros hacia afuera', () => {
    const t = only(buildAll(fakeSource([{ rings: [square(0, 0, 10)], pisos: 1 }])).tiles);
    let roofs = 0;
    for (let f = 0; f < triangleCount(t); f++) {
      const [nx, ny, nz] = faceNormal(t, f);
      const roof = faceVertices(t, f).every((v) => Math.abs(vertexY(t, v) - (H - P)) < 1e-4);
      roofs += roof ? 1 : 0;
      if (roof) expect(ny).toBeGreaterThan(0);
      else expect(Math.abs(ny)).toBeLessThan(1e-6);
      // Muro del tramo (0,0)→(10,0) (el interior queda al norte): mira al sur, +z.
      const south = faceVertices(t, f).every((v) => Math.abs(t.position[3 * v + 2] ?? 1) < 1e-6);
      if (south && !roof) expect(nz).toBeGreaterThan(Math.abs(nx));
    }
    expect(roofs).toBe(2);
  });

  it('con hueco: el patio no lleva techo y sus muros cuentan (n + 2h − 2 triángulos de techo)', () => {
    const t = only(buildAll(fakeSource([{ rings: [square(0, 0, 10), hole(3, -3, 4)], pisos: 3 }])).tiles);
    expect([t.position.length / 3, triangleCount(t)]).toEqual([20 + 8, 16 + 8]);
    const roof = Array.from({ length: triangleCount(t) }, (_, f) => f).filter((f) => faceNormal(t, f)[1] > 0);
    expect(roof).toHaveLength(8);
    expect(roof.some((f) => faceCovers(t, f, 5, -5))).toBe(false); // centro del patio
    expect(roof.some((f) => faceCovers(t, f, 1.5, -1.5))).toBe(true); // techo macizo
  });

  it('voladizo: el muro arranca en base × h; las subterráneas no se dibujan', () => {
    const F = TNT3.banderasEdificio;
    const { tiles, stats } = buildAll(fakeSource([
      { rings: [square(0, 0, 8)], pisos: 2, base: 1, banderas: F.pisosConocidos | F.voladizo },
      { rings: [square(20, 0, 8)], pisos: 0, banderas: F.pisosConocidos | F.subterranea },
    ]));
    const t = only(tiles);
    expect([stats.buildings, Array.from(t.buildings)]).toEqual([1, [0]]);
    const ys = Array.from({ length: t.position.length / 3 }, (_, v) => vertexY(t, v));
    expect(Math.min(...ys)).toBeCloseTo(H);
    // Caja del edificio: minX, minY, minZ, maxX, maxY, maxZ.
    expect(Array.from(t.boxes, round)).toEqual([0, round(H), -8, 8, round(3 * H), 0]);
  });

  it('pisos sin dato (OSM): se dibujan con la regla de 3 pisos', () => {
    const t = only(buildAll(fakeSource([{ rings: [square(0, 0, 6)], pisos: 0, banderas: TNT3.banderasEdificio.osm }])).tiles);
    expect(t.boxes[4]).toBeCloseTo(3 * H);
  });
});
