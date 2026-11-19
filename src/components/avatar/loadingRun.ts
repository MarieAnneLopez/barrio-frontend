import { FRAME_MS, SIZES, sequenceSpec, type SpriteSize } from './sequences';

/**
 * Carrera de la pantalla de carga. Los cuadros de «corriendo» miran a la derecha, así que avanza
 * hacia la derecha. Para que el pie apoyado no patine, ella se desplaza lo mismo que el pie
 * retrocede en el dibujo. Medido en el ciclo de 32 cuadros (sprites32, revisión): en los apoyos
 * (cuadros 0→4 y 20→24, desde 0) el pie retrocede 37,9 y 35,3 px en 4 cuadros; la media de todos
 * los pares que apoyan da 292,8 px por ciclo a 420 px de alto. Se usa 292 (146 a 210, 73 a 105),
 * entero; scripts/sprite_cycles.test.mjs lo vuelve a medir en el ciclo.
 */
export const RUN = { direction: 1, facing: 'right', fps: 1000 / FRAME_MS.run } as const;

/**
 * Pantalla donde cabe a 420 px de alto (si no, 210). index.html precarga el atlas con esta condición
 * y la de densidad (loaderAtlas).
 */
export const LOADER_WIDE = '(min-width: 640px) and (min-height: 860px)';

/**
 * Atlas que comparten las dos Mini Marie de la carga (D111; auditoría MM-01): el menor que cubre el
 * alto de la grande por el múltiplo de densidad (useDensity); si ninguno alcanza, el mayor. La de la
 * barra (105 px) siempre lo reduce; la grande solo se amplía donde no hay uno mayor (420).
 */
export function loaderAtlas(size: number, times: number): SpriteSize<'run'> {
  return SIZES.run.find((atlas) => atlas >= size * times) ?? 420;
}

const STRIDE_AT_420 = 292;
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

/**
 * Recorrido que cruza un ancho de pantalla entero, de fuera a fuera, un cuadro de la carrera cada vez.
 * En bucle el fotograma clave final (offset 1) no se pinta nunca: el último que se ve es el anterior,
 * así que ese ya debe dejarla entera fuera por la derecha (auditoría MM-07). Es el primer cuadro en
 * que ha recorrido la pantalla más su ancho; el recorrido tiene uno más, que nadie ve.
 */
export function runPath(viewport: number, size: number, sprite: number): RunPath {
  let out = 0;
  while (offsetAt(out, size) < viewport + sprite) out += 1;
  const frames = out + 1;
  return { start: -Math.round(sprite), frames, distance: offsetAt(frames, size), durationMs: frames * FRAME_MS.run };
}

/** Posición (px) en la que va a los `ms` de su recorrido en bucle: cada una se sostiene un cuadro. */
export function positionAt(path: RunPath, size: number, ms: number): number {
  const into = ((ms % path.durationMs) + path.durationMs) % path.durationMs;
  return path.start + offsetAt(Math.floor(into / FRAME_MS.run + 1e-6), size);
}

/**
 * Cuadro de `path` en el que llega a `x` (px): para rehacer el recorrido sin saltos al cambiar el
 * ancho (auditoría MM-10). Si en esa pantalla ya habría salido, vuelve a entrar por la izquierda.
 */
export function frameAt(path: RunPath, size: number, x: number): number {
  for (let n = 0; n < path.frames; n += 1) if (path.start + offsetAt(n, size) >= x) return n;
  return 0;
}

/** Un fotograma clave por cuadro, en px enteros; cada posición se sostiene hasta el cuadro siguiente. */
export function runKeyframes(path: RunPath, size: number): Keyframe[] {
  return Array.from({ length: path.frames + 1 }, (_, n) => ({
    offset: n / path.frames,
    easing: 'step-end',
    transform: `translate3d(${path.start + offsetAt(n, size)}px, 0, 0)`,
  }));
}
