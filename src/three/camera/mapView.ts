// Cámara de las secciones con mapa (gran actualización): Mapa 3D, los 14 módulos y la vista de un
// lugar. A diferencia de la órbita del Inicio (referenceView.homeView), el encuadre de mapa va con el
// norte arriba y muestra el barrio entero; los vuelos llevan la cámara hacia un lugar sin bajar nunca
// de 50 m. Funciones puras (x al este, z al sur, y arriba; suelo en y = 0).
import { Vector3 } from 'three';
import { MARKER_Y } from '../places/placeLayers';
import { FOV_DEG, type HomeView } from '../referenceView';

/** Inclinación desde la vertical: un mapa que todavía deja ver el volumen de los edificios. */
export const MAP_PITCH_DEG = 42;
/** La cámara nunca baja de aquí (m): ni en los vuelos ni con los controles. */
export const MIN_CAMERA_Y = 50;
/** Distancia a la que vuela la cámara al elegir un lugar en la lista (m): unas dos manzanas a lo alto. */
export const FOCUS_DISTANCE = 1300;
/** Altura a la que miran los vuelos: la del mapa (contornos y marcadores), con el lugar en el centro de la imagen. */
export const FOCUS_Y = MARKER_Y;
/** Holgura del encuadre para que el borde del barrio no toque el de la imagen (la perspectiva lo agranda). */
const MARGIN = 1.12;
/** En los vuelos la vista queda al menos a esta altura sobre el horizonte. */
const MIN_ELEVATION = (20 * Math.PI) / 180;

export interface MapFraming {
  center: readonly [number, number];
  size: readonly [number, number];
}

export interface Goal {
  target: Vector3;
  position: Vector3;
}

/** Distancia a la que un rectángulo de `size` (m, este-oeste y norte-sur) cabe entero en la imagen de mapa. */
export function fitDistance(size: readonly [number, number], aspect: number): number {
  const tan = Math.tan((FOV_DEG * Math.PI) / 360);
  const pitch = (MAP_PITCH_DEG * Math.PI) / 180;
  const byWidth = size[0] / 2 / (tan * Math.max(aspect, 0.1));
  const byDepth = ((size[1] / 2) * Math.cos(pitch)) / tan; // el fondo se ve acortado por la inclinación
  return Math.max(byWidth, byDepth) * MARGIN;
}

/** Encuadre de mapa: norte arriba, el barrio entero en la imagen, sin pasar de `maxDistance`. */
export function mapView({ center, size }: MapFraming, aspect: number, maxDistance: number): HomeView {
  const pitch = (MAP_PITCH_DEG * Math.PI) / 180;
  const distance = Math.min(maxDistance, fitDistance(size, aspect));
  const target = new Vector3(center[0], 0, center[1]);
  const back = new Vector3(0, Math.cos(pitch), Math.sin(pitch)); // desde el sur, mirando al norte
  return { target, position: target.clone().addScaledVector(back, distance), distance };
}

/** Vuelo hacia un punto: misma dirección de vista que ahora, a `distance` de él y bien por encima del suelo. */
export function focusGoal(point: { x: number; z: number }, distance: number, camera: Vector3, lookAt: Vector3): Goal {
  const target = new Vector3(point.x, FOCUS_Y, point.z);
  const away = camera.clone().sub(lookAt);
  if (away.lengthSq() < 1e-6) away.set(0, 1, 1);
  away.setLength(distance);
  const minY = Math.max(MIN_CAMERA_Y, distance * Math.sin(MIN_ELEVATION));
  if (away.y < minY) {
    const flat = Math.sqrt(Math.max(0, distance * distance - minY * minY));
    const horizontal = Math.hypot(away.x, away.z) || 1;
    away.set((away.x / horizontal) * flat, minY, (away.z / horizontal) * flat);
  }
  return { target, position: target.clone().add(away) };
}

/** La cámara nunca queda por debajo de `minY` (sobre el suelo de la isla). */
export function keepAbove(position: Vector3, minY = MIN_CAMERA_Y): void {
  if (position.y < minY) position.y = minY;
}
