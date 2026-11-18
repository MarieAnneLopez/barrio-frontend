// Reglas de la cámara según la sección que acoge la maqueta (sceneHost.mode). «cine» es el Inicio:
// órbita automática y un dedo que desplaza la página (H34). «mapa» son Mapa 3D, los 14 módulos y la
// vista de un lugar, a pantalla completa: sin órbita, un dedo mueve el mapa y dos acercan o giran.
import { TOUCH } from 'three';
import type { SceneMode } from '../sceneHost';

/** Inclinación máxima desde la vertical (grados): nunca a ras del suelo. */
export const MAX_POLAR_DEG = 78;
/** Lo más cerca que se puede acercar el mapa (m): con FOV de 10° se ve poco más de una manzana. */
export const MAP_MIN_DISTANCE = 600;
/**
 * Lo más lejos que va la cámara del mapa, en radios del barrio: el plano cercano (media distancia,
 * CameraRig) queda antes del sol (6 radios) y de la cúpula del cielo (7), que viajan con la cámara.
 */
export const MAP_REACH = 10;
/** Un dedo no mueve la maqueta del Inicio: desplaza la página. */
export const NO_GESTURE = -1 as TOUCH;

export interface RigLimits {
  orbit: boolean;
  minDistance: number;
  maxDistance: number;
  oneFinger: TOUCH;
  touchAction: 'pan-y' | 'none';
}

/** Topes y gestos de los controles; `home` es la distancia del encuadre de la sección. */
export function rigLimits(mode: SceneMode, home: number, radius: number): RigLimits {
  const far = radius * 4.5;
  if (mode === 'cine') {
    return { orbit: true, minDistance: home * 0.25, maxDistance: far, oneFinger: NO_GESTURE, touchAction: 'pan-y' };
  }
  // En un celular vertical el barrio entero pide alejarse más que en el Inicio: se permite, con tope.
  const maxDistance = Math.min(radius * MAP_REACH, Math.max(far, home * 1.25));
  return { orbit: false, minDistance: MAP_MIN_DISTANCE, maxDistance, oneFinger: TOUCH.PAN, touchAction: 'none' };
}
