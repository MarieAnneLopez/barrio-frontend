import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { FOCUS_DISTANCE, focusGoal, mapView } from '../camera/mapView';
import { FOV_DEG, PODIUM, SHAPE_Y } from '../referenceView';
import { MARKER_Y } from './placeLayers';

// Los marcadores se dibujan encima de todo (sin prueba de profundidad): su altura no los hace más
// visibles, solo los corre en la pantalla. Con la cámara de los mapas (norte arriba, 42° desde la
// vertical) un marcador a 46 m caía ~41 m al norte de su lugar. Pantalla de 1440 × 900 px.
const [W, H] = [1440, 900];
const BARRIO = { center: [120, -40] as const, size: [3400, 2300] as const };
const PLACE = { x: 500, z: 300 };

/** Cámara después del vuelo a PLACE desde el encuadre de mapa, como la deja useCameraGoal. */
function cameraOnPlace(): PerspectiveCamera {
  const view = mapView(BARRIO, W / H, 1e6);
  const goal = focusGoal(PLACE, FOCUS_DISTANCE, view.position, view.target);
  const camera = new PerspectiveCamera(FOV_DEG, W / H, FOCUS_DISTANCE * 0.5, FOCUS_DISTANCE * 2.2);
  camera.position.copy(goal.position);
  camera.lookAt(goal.target);
  camera.updateMatrixWorld();
  return camera;
}

const pixel = (camera: PerspectiveCamera, y: number): [number, number] => {
  const p = new Vector3(PLACE.x, y, PLACE.z).project(camera);
  return [((p.x + 1) / 2) * W, ((1 - p.y) / 2) * H];
};
const apart = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('los marcadores señalan su lugar en el mapa', () => {
  it('el marcador cae sobre el contorno de su figura y sobre la manzana, a menos de 2 px', () => {
    const camera = cameraOnPlace();
    expect(apart(pixel(camera, MARKER_Y), pixel(camera, SHAPE_Y))).toBeLessThan(2);
    expect(apart(pixel(camera, MARKER_Y), pixel(camera, PODIUM))).toBeLessThan(2);
  });

  it('el vuelo al foco deja el lugar (no un marcador flotante) en el centro de la imagen', () => {
    const camera = cameraOnPlace();
    expect(apart(pixel(camera, SHAPE_Y), [W / 2, H / 2])).toBeLessThan(2);
  });
});
