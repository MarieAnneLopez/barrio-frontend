import type { Geometry } from 'geojson';
import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { geometryBounds } from '../../lib/placeCenter';
import { FOV_DEG, SHAPE_Y } from '../referenceView';
import { FOCUS_DISTANCE, focusGoal, mapView } from './mapView';
import { placeFocus } from './placeFocus';

// Proyección de prueba: un grado son 1 000 m (x al este, z al sur).
const project = ([lon = 0, lat = 0]: readonly number[]): [number, number] => [lon * 1000, -lat * 1000];
const BARRIO = { center: [0, 0] as const, size: [3400, 2300] as const };
const rect = (w: number, h: number): Geometry => ({
  type: 'Polygon', coordinates: [[[0, 0], [w, 0], [w, h], [0, h], [0, 0]]],
});
const PARK = rect(0.6, 0.45); // un parque grande: 600 × 450 m
const AVENUE: Geometry = { type: 'LineString', coordinates: [[0, 0], [0.5, 0.05], [1.2, 0.1]] }; // un tramo de 1,2 km

/** Esquinas de la figura vistas por la cámara después del vuelo desde el encuadre de mapa (coordenadas -1…1). */
function cornersAfterFlight(geometry: Geometry, aspect: number): Vector3[] {
  const target = placeFocus(geometry, project, aspect);
  if (!target) throw new Error('sin vuelo');
  const view = mapView(BARRIO, aspect, 1e6);
  const goal = focusGoal(target, target.distance ?? FOCUS_DISTANCE, view.position, view.target);
  const camera = new PerspectiveCamera(FOV_DEG, aspect, 1, 1e6);
  camera.position.copy(goal.position);
  camera.lookAt(goal.target);
  camera.updateMatrixWorld();
  const [[west, south], [east, north]] = geometryBounds(geometry) ?? [[0, 0], [0, 0]];
  return [[west, south], [east, south], [east, north], [west, north]].map(([lon = 0, lat = 0]) => {
    const [x, z] = project([lon, lat]);
    return new Vector3(x, SHAPE_Y, z).project(camera);
  });
}

describe('vuelo a un lugar de la lista: la cámara encuadra su figura entera', () => {
  it('un punto: al punto, a la distancia de siempre', () => {
    expect(placeFocus({ type: 'Point', coordinates: [0.1, 0.2] }, project, 1.6)).toEqual({
      x: 100, z: -200, distance: FOCUS_DISTANCE,
    });
  });

  it.each([16 / 10, 390 / 780])('un parque grande y un tramo largo caben enteros en la imagen (aspecto %f)', (aspect) => {
    for (const geometry of [PARK, AVENUE]) {
      expect(placeFocus(geometry, project, aspect)?.distance).toBeGreaterThan(FOCUS_DISTANCE);
      for (const corner of cornersAfterFlight(geometry, aspect)) {
        expect(Math.abs(corner.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(corner.y)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('va al centro de la figura; una pequeña no acerca la cámara más que un punto', () => {
    expect(placeFocus(rect(0.02, 0.04), project, 1.6)).toEqual({ x: 10, z: -20, distance: FOCUS_DISTANCE });
  });

  it('sin geometría no hay vuelo', () => {
    expect(placeFocus(null, project, 1.6)).toBeNull();
  });
});
