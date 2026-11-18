import { FRAME_MS } from './sequences';

/**
 * Carrera de la pantalla de carga. Los cuadros de «corriendo» miran a la derecha, así que avanza
 * hacia la derecha. Para que el pie apoyado no patine, ella se desplaza por cuadro lo mismo que el
 * pie retrocede en el dibujo: 38 px a 420 px de alto (medido en la tira), en proporción a otros altos.
 */
export const RUN = { direction: 1, facing: 'right', fps: 1000 / FRAME_MS.run } as const;

const STEP_AT_420 = 38;

/** Píxeles enteros que avanza por cuadro a ese alto. */
export function stepPx(size: number): number {
  return Math.round((STEP_AT_420 * size) / 420);
}

export interface RunPath {
  /** Desplazamiento inicial (px): entra entera desde fuera, por la izquierda. */
  start: number;
  /** Recorrido total (px), múltiplo exacto del paso. */
  distance: number;
  steps: number;
  durationMs: number;
}

/** Recorrido que cruza un ancho de pantalla entero, de fuera a fuera, en pasos sincronizados con los cuadros. */
export function runPath(viewport: number, size: number, sprite: number): RunPath {
  const step = stepPx(size);
  const steps = Math.ceil((viewport + sprite) / step);
  return { start: -Math.round(sprite), distance: steps * step, steps, durationMs: steps * FRAME_MS.run };
}
