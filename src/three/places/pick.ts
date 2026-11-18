import type { RootState } from '@react-three/fiber';
import { Plane, Vector3, type Intersection, type Object3D, type Raycaster } from 'three';
import { FOV_DEG, SHAPE_Y } from '../referenceView';
import { shapeAt, type PlaceShapes } from './placeShapes';

/** Proyecta un punto del mundo a píxeles de la pantalla; null si queda detrás de la cámara. */
export type ToScreen = (x: number, y: number, z: number) => [number, number] | null;

/** Radio en píxeles que cuenta como «sobre el marcador» (medio marcador y un margen para el dedo). */
export const PICK_PX = 20;

/** Índice del marcador más cercano al puntero dentro de `radius` píxeles; -1 si no hay ninguno. */
export function nearestMarker(
  markers: ArrayLike<number>,
  toScreen: ToScreen,
  pointer: readonly [number, number],
  radius: number,
): number {
  let best = -1;
  let bestDistance = radius * radius;
  for (let i = 0; i + 2 < markers.length; i += 3) {
    const at = toScreen(markers[i] ?? 0, markers[i + 1] ?? 0, markers[i + 2] ?? 0);
    if (!at) continue;
    const distance = (at[0] - pointer[0]) ** 2 + (at[1] - pointer[1]) ** 2;
    if (distance <= bestDistance) {
      best = i / 3;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * `raycast` de r3f para los marcadores (Points de tamaño fijo en píxeles): mide en la pantalla, así
 * un marcador se elige igual de fácil con la cámara lejos o cerca. El acierto va primero (distancia
 * 0) porque el marcador se dibuja encima de todo, también de un edificio que tenga delante.
 */
export function screenPick(get: () => RootState, markers: Float32Array, radius = PICK_PX) {
  const v = new Vector3();
  return function raycast(this: Object3D, _raycaster: Raycaster, hits: Intersection[]): void {
    const { camera, size, pointer } = get();
    const toScreen: ToScreen = (x, y, z) => {
      v.set(x, y, z).project(camera);
      return v.z > 1 ? null : [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height];
    };
    const at: [number, number] = [((pointer.x + 1) / 2) * size.width, ((1 - pointer.y) / 2) * size.height];
    const index = nearestMarker(markers, toScreen, at, radius);
    if (index >= 0) hits.push({ distance: 0, point: new Vector3().fromArray(markers, index * 3), index, object: this });
  };
}

/** Metros que cubre un píxel a `distance` de la cámara, con una vista de `fovDeg` grados y `heightPx` de alto. */
export function metersPerPixel(distance: number, heightPx: number, fovDeg: number): number {
  return (2 * distance * Math.tan((fovDeg * Math.PI) / 360)) / Math.max(1, heightPx);
}

const GROUND = new Plane(new Vector3(0, 1, 0), -SHAPE_Y); // el plano de los contornos

/**
 * `raycast` de r3f para las figuras que se eligen en el suelo (placeShapes): corta el rayo con el
 * plano de los contornos y busca la figura bajo ese punto, con PICK_PX de margen para los trazos.
 * La distancia del acierto es la del rayo: lo que esté delante (un edificio) gana.
 */
export function groundPick(get: () => RootState, shapes: PlaceShapes, outline: Float32Array, radius = PICK_PX) {
  const at = new Vector3();
  return function raycast(this: Object3D, raycaster: Raycaster, hits: Intersection[]): void {
    if (!raycaster.ray.intersectPlane(GROUND, at)) return;
    const { camera, size } = get();
    const distance = raycaster.ray.origin.distanceTo(at);
    const fov = 'fov' in camera ? camera.fov : FOV_DEG;
    const index = shapeAt(shapes, outline, at.x, at.z, radius * metersPerPixel(distance, size.height, fov));
    if (index >= 0) hits.push({ distance, point: at.clone(), index, object: this });
  };
}
