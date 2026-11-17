// Matemática pura del vuelo entre fotos (capítulo 2 del Inicio). Distancias en px del espacio 3D;
// los números son los de docs/superpowers/specs/2026-11-16-interfaz-elegante-design.md, §6.
const PERSPECTIVE = 30; // igual que `perspective` en flight.css: el ojo queda a 30 px del plano z = 0
const STEP = 100; // separación entre tarjetas y avance de la cámara por foto
const RATIOS = [1.15, 0.82, 1.45, 0.82]; // ancho / alto, en ciclo

export interface CardFrame {
  /** Posición de la tarjeta respecto a la cámara: a 30 px está en el ojo. */
  z: number;
  opacity: number;
  hidden: boolean;
}

export const clamp = (t: number): number => Math.min(1, Math.max(0, t));

export const smooth = (t: number): number => clamp(t) ** 2 * (3 - 2 * clamp(t));

/** Avance del recorrido (0 a 1): `top` es el borde superior de la sección y `travel` lo que puede subir. */
export const progress = (top: number, travel: number): number => (travel > 0 ? clamp(-top / travel) : 0);

/** Profundidad de la cámara: avanza una separación por cada una de las `count` fotos. */
export const cameraZ = (p: number, count: number): number => PERSPECTIVE + STEP * count * p;

/** Profundidad fija de la tarjeta `i` (desde 0) dentro del espacio de imágenes. */
export const imageZ = (i: number): number => -STEP * (i + 1);

/** La tarjeta `i` vista desde la cámara: entra desde lejos, se desvanece al pasar y luego se oculta. */
export function cardFrame(i: number, camera: number): CardFrame {
  const z = camera + imageZ(i);
  const opacity = smooth((z + 240) / 100) * (1 - smooth((z - 20) / 8));
  return { z, opacity, hidden: z >= PERSPECTIVE - 1 || opacity <= 0.001 };
}

/** Proporción (ancho / alto) de la tarjeta `i`. */
export const cardRatio = (i: number): number => RATIOS[i % RATIOS.length] ?? 1;

/** Las tarjetas pares van a la izquierda y las impares a la derecha. */
export const cardSide = (i: number): 'left' | 'right' => (i % 2 === 0 ? 'left' : 'right');
