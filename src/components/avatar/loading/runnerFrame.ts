import { stridePx } from '../loadingRun';
import { sequenceSpec } from '../sequences';

/** Alto CSS de Mini Marie en la barra. */
export const BAR_RUNNER_SIZE = 120;

// Desplazamiento horizontal a 420 px: en cada tramo con la bota en el suelo se fija
// su posición más a la izquierda (pie + avance). En el aire se interpola entre apoyos.
const FOOT_SHIFT = [
  -4, -14, -9, -1, -8, 0, -6, -5, -4, -3, -2, -1, 0, -23, -20, -23,
  -27, 0, -2, -6, -6, -6, -7, -7, -7, -7, -8, -8, -8, 0, -6, -5,
];

export function footShift(frame: number, size = BAR_RUNNER_SIZE): number {
  return Math.round(((FOOT_SHIFT[frame % FOOT_SHIFT.length] ?? 0) * size) / 420);
}

/**
 * Cuadro del ciclo según la distancia real recorrida por la punta de la barra.
 */
export function runnerFrame(px: number, size = BAR_RUNNER_SIZE): number {
  const frames = sequenceSpec('run').frames;
  return Math.floor((Math.max(0, px) * frames) / stridePx(size)) % frames;
}
