import type { RootState } from '@react-three/fiber';
import { Vector3, type Intersection, type Object3D, type Raycaster } from 'three';

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
