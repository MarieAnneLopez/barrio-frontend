// Movimiento de la cinta: un desplazamiento (en unidades del mundo) que persigue a su objetivo con
// suavizado exponencial, independiente de los cuadros por segundo. Sin DOM ni three.

/** Rapidez del suavizado, en 1/s: current += (target − current) · (1 − e^(−7 dt)). */
export const SMOOTHING = 7;
/** Paso máximo de tiempo: una pausa larga no da un salto. */
export const MAX_DT = 0.05;
/** Debajo de esta distancia (unidades del mundo) la cinta se da por quieta. */
export const SETTLED = 1e-3;
export const WHEEL_GAIN = 0.8;
export const LAUNCH = { gain: 6, windowMs: 100 } as const;
/** deltaMode de la rueda: 0 = píxeles, 1 = líneas, 2 = páginas. */
const WHEEL_UNIT = [1, 16, 800];

export interface Motion {
  /** Lo que se dibuja. */
  current: number;
  /** Adonde va: lo fijan la rueda, el arrastre, las flechas y los clics. */
  target: number;
  /** Se está arrastrando. */
  held: boolean;
}

export const createMotion = (): Motion => ({ current: 0, target: 0, held: false });

/** Avanza un cuadro y dice si aún se mueve. Con movimiento reducido llega al objetivo al instante. */
export function stepMotion(motion: Motion, dt: number, reduced: boolean): boolean {
  if (!reduced) {
    const step = Math.min(Math.max(dt, 0), MAX_DT);
    motion.current += (motion.target - motion.current) * (1 - Math.exp(-SMOOTHING * step));
  }
  if (reduced || Math.abs(motion.target - motion.current) < SETTLED) {
    motion.current = motion.target;
    return false;
  }
  return true;
}

/** Píxeles de un evento de rueda en su eje dominante (un panel táctil también desliza en horizontal). */
export function wheelPixels(deltaX: number, deltaY: number, deltaMode: number): number {
  const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
  return delta * (WHEEL_UNIT[deltaMode] ?? 1);
}

export const wheelTarget = (target: number, pixels: number, unitsPerPixel: number): number =>
  target + pixels * WHEEL_GAIN * unitsPerPixel;

/** Objetivo durante el arrastre: el contenido sigue al puntero (arrastrar a la izquierda avanza). */
export const dragTarget = (start: number, dx: number, unitsPerPixel: number): number => start - dx * unitsPerPixel;

/** Al soltar, el último movimiento (px) se lanza × 6 si fue hace menos de 100 ms. */
export function launchTarget(target: number, lastDx: number, sinceMs: number, unitsPerPixel: number): number {
  return sinceMs < LAUNCH.windowMs ? target - lastDx * LAUNCH.gain * unitsPerPixel : target;
}
