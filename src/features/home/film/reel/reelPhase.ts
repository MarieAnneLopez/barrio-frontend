// La fase del reel es un índice flotante que persigue a su objetivo con una amortiguación
// exponencial (independiente de los cuadros por segundo). Funciones puras.
import { mod } from './reelMath';

/** Rapidez de la amortiguación, en 1/s. */
export const DAMPING = 13;
/** Paso máximo de tiempo: una pausa larga (pestaña oculta, cuadro lento) no da un salto. */
export const MAX_DT = 0.05;

/** Un cuadro de amortiguación: phase += (target − phase) · (1 − e^(−13·dt)), con dt ≤ 0,05 s. */
export function dampStep(phase: number, target: number, dt: number): number {
  const step = Math.min(Math.max(dt, 0), MAX_DT);
  return phase + (target - phase) * (1 - Math.exp(-DAMPING * step));
}

/** Al soltar (o al parar el scroll), el reel asienta en el índice más cercano. */
export const settleIndex = (target: number): number => Math.round(target);

/** Módulo (0 … N−1) que queda en el centro para una fase cualquiera. */
export const moduleIndex = (phase: number, count: number): number => mod(Math.round(phase), count);

/** El equivalente de `index` (sumándole vueltas enteras) más cercano a `reference`: el camino corto por el anillo. */
export function nearestTurn(index: number, reference: number, count: number): number {
  return index + count * Math.round((reference - index) / count);
}
