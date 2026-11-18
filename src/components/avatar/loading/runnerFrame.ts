import { stridePx } from '../loadingRun';
import { sequenceSpec } from '../sequences';

/** Alto de la Mini Marie de la barra (escala entera, D86: un cuarto de la de 420). */
export const BAR_RUNNER_SIZE = 105;

/**
 * Cuadro del ciclo tras `px` de recorrido de la punta: uno por cada zancada / 32 (2,28 px a 105),
 * así ni corre en el sitio ni patina. La barra lo pide en cada rAF con la posición real (MM-09).
 */
export function runnerFrame(px: number, size = BAR_RUNNER_SIZE): number {
  const frames = sequenceSpec('run').frames;
  return Math.floor((Math.max(0, px) * frames) / stridePx(size)) % frames;
}
