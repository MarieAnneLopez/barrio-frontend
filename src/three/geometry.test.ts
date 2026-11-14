import type { Feature, Polygon } from 'geojson';
import { describe, expect, it } from 'vitest';
import { extrudeFeatures, triangleCount } from './extrude';
import { createProjection } from './projection';
import { buildRibbons } from './ribbons';

const BBOX: [number, number, number, number] = [-74.18, 4.64, -74.14, 4.66];
const project = createProjection(BBOX);

const square = (x: number, y: number, d = 0.0005): Feature<Polygon> => ({
  type: 'Feature',
  properties: { levels: '4' },
  geometry: { type: 'Polygon', coordinates: [[[x, y], [x + d, y], [x + d, y + d], [x, y + d], [x, y]]] },
});

describe('projection', () => {
  it('centra el bbox en el origen y mide en metros reales', () => {
    const [x0, z0] = project([-74.16, 4.65]);
    const [x1] = project([-74.15, 4.65]);
    expect(Math.abs(x0)).toBeLessThan(1e-6);
    expect(Math.abs(z0)).toBeLessThan(1e-6);
    // 0,01° de longitud en el ecuador de Bogotá ≈ 1,11 km
    expect(x1 - x0).toBeGreaterThan(1100);
    expect(x1 - x0).toBeLessThan(1115);
  });

  it('el norte queda hacia -z (convención de three)', () => {
    expect(project([-74.16, 4.66])[1]).toBeLessThan(0);
  });
});

describe('extrudeFeatures', () => {
  it('fusiona todos los polígonos en una geometría con id por vértice', () => {
    const geometry = extrudeFeatures([square(-74.16, 4.65), square(-74.15, 4.65)], project, () => 12);

    const ids = new Set(Array.from(geometry.getAttribute('featureId').array));
    expect(ids).toEqual(new Set([0, 1]));
    expect(triangleCount(geometry)).toBeGreaterThan(0);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox?.max.y).toBeCloseTo(12);
  });

  it('ignora geometrías vacías sin romper', () => {
    const empty = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [] } };
    const geometry = extrudeFeatures([empty as Feature<Polygon>], project, () => 3);
    expect(triangleCount(geometry)).toBe(0);
  });
});

describe('buildRibbons', () => {
  it('convierte líneas en cintas planas (2 triángulos por tramo)', () => {
    const line: Feature = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: [[-74.16, 4.65], [-74.155, 4.65], [-74.15, 4.651]] },
    };
    const geometry = buildRibbons([line], project, () => 8, 0.2);

    expect(triangleCount(geometry)).toBe(4);
  });
});
