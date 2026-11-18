import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { FOV_DEG } from '../referenceView';
import { MARKER_Y } from '../places/placeLayers';
import { FOCUS_Y, focusGoal, keepAbove, mapView, MIN_CAMERA_Y } from './mapView';

const BARRIO = { center: [120, -40] as [number, number], size: [3400, 2300] as [number, number] };

/** Proyecta las esquinas del barrio con una cámara puesta en el encuadre: todas dentro de la imagen. */
function cornersOnScreen(aspect: number) {
  const view = mapView(BARRIO, aspect, 1e6);
  const camera = new PerspectiveCamera(FOV_DEG, aspect, 10, 1e6);
  camera.position.copy(view.position);
  camera.lookAt(view.target);
  camera.updateMatrixWorld();
  const [cx, cz] = BARRIO.center;
  const [w, d] = BARRIO.size;
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx = 0, sz = 0]) =>
    new Vector3(cx + (sx * w) / 2, 0, cz + (sz * d) / 2).project(camera));
}

describe('encuadre de mapa de las secciones con mapa', () => {
  it.each([16 / 10, 1, 390 / 780])('todo el barrio cabe en la imagen (aspecto %f)', (aspect) => {
    for (const p of cornersOnScreen(aspect)) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(1);
    }
  });

  it('norte arriba: la cámara mira al centro del barrio desde el sur y bien por encima de 50 m', () => {
    const view = mapView(BARRIO, 1.6, 1e6);
    expect(view.target.toArray()).toEqual([120, 0, -40]);
    expect(view.position.x).toBeCloseTo(120);
    expect(view.position.z).toBeGreaterThan(-40);
    expect(view.position.y).toBeGreaterThan(MIN_CAMERA_Y);
    expect(view.position.distanceTo(view.target)).toBeCloseTo(view.distance);
  });

  it('no se aleja más que el tope de los controles (en el celular el barrio se recorta a los lados)', () => {
    expect(mapView(BARRIO, 0.3, 9000).distance).toBe(9000);
  });
});

describe('vuelo al foco', () => {
  it('conserva la dirección de la vista y queda a la distancia pedida del punto, mirando a la altura de los marcadores', () => {
    const goal = focusGoal({ x: 500, z: 300 }, 1300, new Vector3(0, 800, 600), new Vector3(0, 0, 0));
    expect(goal.target.toArray()).toEqual([500, FOCUS_Y, 300]);
    expect(Math.abs(MARKER_Y - FOCUS_Y)).toBeLessThan(10); // el marcador queda casi en el centro de la imagen
    expect(goal.position.distanceTo(goal.target)).toBeCloseTo(1300);
    const before = new Vector3(0, 800, 600).normalize();
    expect(goal.position.clone().sub(goal.target).normalize().dot(before)).toBeCloseTo(1);
  });

  it('desde una vista casi a ras del suelo sube para no quedar por debajo de 50 m', () => {
    const goal = focusGoal({ x: 0, z: 0 }, 200, new Vector3(1000, 1, 0), new Vector3(0, 0, 0));
    expect(goal.position.y).toBeGreaterThanOrEqual(MIN_CAMERA_Y);
    expect(goal.position.distanceTo(goal.target)).toBeCloseTo(200);
  });

  it('la cámara nunca baja de y = 50 m', () => {
    const low = new Vector3(10, 12, 10);
    keepAbove(low);
    expect(low.toArray()).toEqual([10, MIN_CAMERA_Y, 10]);
    const high = new Vector3(0, 900, 0);
    keepAbove(high);
    expect(high.y).toBe(900);
  });
});
