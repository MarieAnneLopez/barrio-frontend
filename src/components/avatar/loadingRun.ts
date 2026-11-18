import { FRAME_MS, sequenceSpec } from './sequences';

/**
 * Carrera de la pantalla de carga. Los cuadros de «corriendo» miran a la derecha, así que avanza
 * hacia la derecha. Para que el pie apoyado no patine, ella se desplaza lo mismo que el pie
 * retrocede en el dibujo. Medido en el ciclo de 32 cuadros (sprites32): el talón apoyado pasa de
 * x = 129 a x = 91 px entre los cuadros 21 y 25 (de un dibujado al siguiente), 38 px en 4 cuadros:
 * 9,5 px por cuadro a 420 px de alto, 304 px por ciclo (la misma medida que en la tira de 8).
 */
export const RUN = { direction: 1, facing: 'right', fps: 1000 / FRAME_MS.run } as const;

/**
 * Pantalla donde cabe a 420 px de alto sin que su cabeza llegue al sol del barrio en capas (si no,
 * 210). index.html precarga el atlas con esta misma condición.
 */
export const LOADER_WIDE = '(min-width: 640px) and (min-height: 860px)';

const STRIDE_AT_420 = 304;
const FRAMES = sequenceSpec('run').frames;

/** Zancada: px que avanza en un ciclo entero a ese alto (304, 152 o 76; enteros). */
export function stridePx(size: number): number {
  return (STRIDE_AT_420 * size) / 420;
}

/** Px enteros avanzados tras n cuadros: n · zancada / cuadros, redondeado (sin acumular error). */
export function offsetAt(n: number, size: number): number {
  return Math.round((n * stridePx(size)) / FRAMES);
}

export interface RunPath {
  /** Desplazamiento inicial (px): entra entera desde fuera, por la izquierda. */
  start: number;
  /** Cuadros que tarda en cruzar. */
  frames: number;
  /** Recorrido total (px enteros) en esos cuadros. */
  distance: number;
  durationMs: number;
}

/** Recorrido que cruza un ancho de pantalla entero, de fuera a fuera, un cuadro de la carrera cada vez. */
export function runPath(viewport: number, size: number, sprite: number): RunPath {
  const frames = Math.ceil(((viewport + sprite) * FRAMES) / stridePx(size));
  return { start: -Math.round(sprite), frames, distance: offsetAt(frames, size), durationMs: frames * FRAME_MS.run };
}

/** Un fotograma clave por cuadro, en px enteros; cada posición se sostiene hasta el cuadro siguiente. */
export function runKeyframes(path: RunPath, size: number): Keyframe[] {
  return Array.from({ length: path.frames + 1 }, (_, n) => ({
    offset: n / path.frames,
    easing: 'step-end',
    transform: `translate3d(${path.start + offsetAt(n, size)}px, 0, 0)`,
  }));
}
