import { stridePx } from '../loadingRun';
import { sequenceSpec } from '../sequences';

/** Alto de la Mini Marie de la barra (escala entera, D86: un cuarto de la de 420). */
export const BAR_RUNNER_SIZE = 105;

/** Ancho de la barra (loading-bar.css: min(32rem, 82vw)). */
export const barWidth = () => Math.min(512, (typeof window === 'undefined' ? 512 : window.innerWidth) * 0.82);

/** Cuadro del ciclo para un avance de la barra: uno por cada zancada / 32 recorrida. */
export function runnerFrame(shown: number, width: number, size = BAR_RUNNER_SIZE): number {
  const frames = sequenceSpec('run').frames;
  const step = stridePx(size) / frames;
  return Math.floor((Math.max(0, shown) * width) / step) % frames;
}
