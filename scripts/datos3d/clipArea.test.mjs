// @vitest-environment node
// Recorte de áreas (parques, pasto, agua) al polígono del barrio, como el ST_Intersection del ETL.
import { describe, expect, it } from 'vitest';
import { clipPolygon } from './clipArea.mjs';
import { signedArea } from './geo.mjs';

const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; // z1 < z0: antihorario
const area = (polygons) => polygons.reduce((t, [outer]) => t + Math.abs(signedArea(outer)), 0);
const barrio = [rect(0, 0, 100, -100)];
const notched = [[[0, 0], [40, 0], [40, -50], [60, -50], [60, 0], [100, 0], [100, -100], [0, -100]]];

describe('clipPolygon', () => {
  it('un área toda dentro queda igual', () => {
    const park = [rect(10, -10, 30, -30)];
    expect(clipPolygon(park, barrio)).toEqual({ polygons: [park], recortada: false });
  });

  it('un área que sale del barrio se queda solo con lo de dentro', () => {
    const { polygons, recortada } = clipPolygon([rect(-10, 10, 10, -10)], barrio);
    expect(recortada).toBe(true);
    expect(polygons).toHaveLength(1);
    expect(area(polygons)).toBeCloseTo(100, 6);
  });

  it('si el borde la parte en dos, salen dos áreas', () => {
    const { polygons } = clipPolygon([rect(30, -30, 70, -40)], notched);
    expect(polygons).toHaveLength(2);
    expect(area(polygons)).toBeCloseTo(200, 6);
  });

  it('los huecos que quedan dentro se conservan', () => {
    const lake = [rect(-10, -20, 50, -60), rect(20, -30, 30, -40)];
    const { polygons } = clipPolygon(lake, barrio);
    expect(polygons).toHaveLength(1);
    expect(polygons[0]).toHaveLength(2);
  });
});
