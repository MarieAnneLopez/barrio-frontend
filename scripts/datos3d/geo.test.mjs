// @vitest-environment node
// Geometría plana del script de datos 3D: misma proyección que la escena y operaciones básicas.
import { describe, expect, it } from 'vitest';
import { createProjection as sceneProjection } from '../../src/three/projection.ts';
import { bounds, centroid, createProjection, projectionInfo, signedArea } from './geo.mjs';
import { distanceToRings, pointInPolygon, pointInRing, pointOnSurface } from './inside.mjs';

const BBOX = [-74.177402, 4.639954, -74.137115, 4.664206];
const square = (x, z, d) => [[x, z], [x + d, z], [x + d, z - d], [x, z - d]];

describe('proyección', () => {
  it('da exactamente lo mismo que src/three/projection.ts', () => {
    const mine = createProjection(BBOX);
    const scene = sceneProjection(BBOX);
    for (const p of [[-74.16, 4.65], [-74.177402, 4.639954], [-74.137115, 4.664206], [-74.15, 4.66]]) {
      expect(mine(p)).toEqual(scene(p));
    }
  });

  it('informa el origen y las escalas que usa', () => {
    const info = projectionInfo(BBOX);
    expect(info.origen[0]).toBeCloseTo(-74.1572585, 9);
    expect(info.origen[1]).toBeCloseTo(4.65208, 9);
    expect(info.metrosPorGradoLat).toBe(110_574);
    expect(info.metrosPorGradoLon).toBeCloseTo(111_320 * Math.cos((4.65208 * Math.PI) / 180), 6);
  });
});

describe('anillos', () => {
  // En x/z (z al sur) un cuadrado recorrido este → norte es antihorario visto desde arriba.
  const ccw = square(0, 0, 10);

  it('el área con signo es positiva si el anillo gira antihorario mirado desde arriba', () => {
    expect(signedArea(ccw)).toBeCloseTo(100);
    expect(signedArea([...ccw].reverse())).toBeCloseTo(-100);
  });

  it('el centroide de un cuadrado es su centro y su caja la del cuadrado', () => {
    expect(centroid(ccw)).toEqual([5, -5]);
    expect(bounds(ccw)).toEqual([0, -10, 10, 0]);
  });

  it('punto dentro y fuera, con huecos', () => {
    const hole = square(3, -3, 4);
    expect(pointInRing([5, -5], ccw)).toBe(true);
    expect(pointInRing([15, -5], ccw)).toBe(false);
    expect(pointInPolygon([1, -1], [ccw, hole])).toBe(true);
    expect(pointInPolygon([5, -5], [ccw, hole])).toBe(false);
  });

  it('el punto interior de una U cae dentro aunque el centroide no', () => {
    const u = [[0, 0], [30, 0], [30, -30], [20, -30], [20, -10], [10, -10], [10, -30], [0, -30]];
    expect(pointInRing(centroid(u), u)).toBe(false);
    expect(pointInRing(pointOnSurface([u]), u)).toBe(true);
  });

  it('distancia de un punto a un polígono: 0 dentro, al borde más cercano fuera', () => {
    expect(distanceToRings([5, -5], [ccw])).toBe(0);
    expect(distanceToRings([13, -5], [ccw])).toBeCloseTo(3);
    expect(distanceToRings([13, 4], [ccw])).toBeCloseTo(5);
  });
});
