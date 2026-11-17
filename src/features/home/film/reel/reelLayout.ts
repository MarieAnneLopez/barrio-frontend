// Trazado del reel según el lienzo: escala, trackRadius y trackDepth para que la tarjeta central
// ocupe el 37 % del ancho en escritorio y el 77 % en teléfono, con 3 tarjetas a la vista en
// escritorio. La pista guarda proporciones fijas con la escala, así el reel es el mismo dibujo
// a cualquier tamaño. Funciones puras: la proyección se resuelve en forma cerrada.
import { BEND_REST, bendPoint, HALF_WIDTH, PLANE } from './reelBend';
import { DEPTH_OFFSET, PITCH, type Track } from './reelMath';

export const CAMERA = { fov: 65.7, z: 8.1, near: 0.1, far: 40 } as const;
/** trackRadius = 3,6 · escala: las vecinas quedan al lado de la central, con un hueco, sin pisarla. */
export const RADIUS_RATIO = 3.6;
/** trackDepth = 1,1 · escala: las vecinas giran ~15° y las siguientes ya dan la espalda a la cámara. */
export const DEPTH_RATIO = 1.1;
/** Fracción del ancho que ocupa la tarjeta central, según la proporción del lienzo (ancho / alto). */
const PHONE = { aspect: 0.5, fraction: 0.77 };
const DESKTOP = { aspect: 1.5, fraction: 0.37 };
/** En pantallas muy anchas manda el alto: la tarjeta no pasa de esta parte del lienzo. */
const MAX_HEIGHT = 0.53;

const TAN = Math.tan((CAMERA.fov * Math.PI) / 360);
/** Borde de la tarjeta ya curvada (sin escalar): mitad de su ancho visible y cuánto se aleja. */
const EDGE = bendPoint(HALF_WIDTH, 0, BEND_REST);
/** De la cámara al eje de la pista. */
const REACH = CAMERA.z - DEPTH_OFFSET;

export interface ReelLayout extends Track {
  /** Escala de cada tarjeta (y de toda la pista). */
  scale: number;
  /** Parte del ancho del lienzo que ocupa la tarjeta central. */
  fraction: number;
  /** Tamaño en pantalla de la tarjeta central, en px. */
  cardWidth: number;
  cardHeight: number;
  /** Lo que mide 1 px de pantalla sobre la tarjeta central, en unidades del plano. */
  unitsPerPixel: number;
}

/** Del 77 % (teléfono) al 37 % (escritorio), lineal con la proporción del lienzo y sin salirse. */
export function targetFraction(aspect: number): number {
  const t = (aspect - PHONE.aspect) / (DESKTOP.aspect - PHONE.aspect);
  return PHONE.fraction + (DESKTOP.fraction - PHONE.fraction) * Math.min(1, Math.max(0, t));
}

/** Escala con la que la tarjeta central ocupa `fraction` del ancho (sus bordes quedan algo más lejos). */
function scaleForWidth(fraction: number, aspect: number): number {
  const k = fraction * TAN * aspect;
  return (REACH * k) / (EDGE.x + k * (DEPTH_RATIO + EDGE.z));
}

/** Escala con la que la tarjeta central ocupa `share` del alto. */
function scaleForHeight(share: number): number {
  const k = 2 * TAN * share;
  return (REACH * k) / (PLANE.height + k * DEPTH_RATIO);
}

export function layoutFor(width: number, height: number): ReelLayout {
  const aspect = width / Math.max(height, 1);
  const scale = Math.min(scaleForWidth(targetFraction(aspect), aspect), scaleForHeight(MAX_HEIGHT));
  const center = REACH - DEPTH_RATIO * scale; // de la cámara al centro de la tarjeta central
  const fraction = (EDGE.x * scale) / ((center - EDGE.z * scale) * TAN * aspect);
  return {
    scale,
    radius: RADIUS_RATIO * scale,
    depth: DEPTH_RATIO * scale,
    pitch: PITCH * scale,
    fraction,
    cardWidth: fraction * width,
    cardHeight: ((PLANE.height * scale) / (2 * TAN * center)) * height,
    unitsPerPixel: (2 * EDGE.x) / Math.max(fraction * width, 1),
  };
}
