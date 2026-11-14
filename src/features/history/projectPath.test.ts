import type { MultiPolygon, Point } from 'geojson';
import { describe, expect, it } from 'vitest';
import { bboxOf, makeProjection, svgPath } from './projectPath';

const square: MultiPolygon = {
  type: 'MultiPolygon',
  coordinates: [[[[-74.2, 4.6], [-74.1, 4.6], [-74.1, 4.7], [-74.2, 4.7], [-74.2, 4.6]]]],
};

describe('projectPath', () => {
  it('calcula el bbox de un multipolígono', () => {
    expect(bboxOf(square)).toEqual([-74.2, 4.6, -74.1, 4.7]);
  });

  it('proyecta con el norte arriba y corrige el ancho por la latitud', () => {
    const { height, project } = makeProjection(bboxOf(square), 400);
    expect(project([-74.2, 4.7])).toBe('0.0,0.0');
    expect(project([-74.1, 4.6])).toBe(`400.0,${height.toFixed(1)}`);
    // Un grado de longitud mide cos(lat) grados de latitud: el cuadrado sale más alto que ancho.
    expect(height).toBeGreaterThan(400);
  });

  it('genera un subcamino cerrado por anillo e ignora geometrías no poligonales', () => {
    const { project } = makeProjection(bboxOf(square), 100);
    // Empieza en la esquina suroeste (abajo a la izquierda) y cierra el anillo.
    expect(svgPath(square, project)).toBe('M0.0,100.3L100.0,100.3L100.0,0.0L0.0,0.0L0.0,100.3Z');
    const point: Point = { type: 'Point', coordinates: [-74.15, 4.65] };
    expect(svgPath(point, project)).toBe('');
  });
});
