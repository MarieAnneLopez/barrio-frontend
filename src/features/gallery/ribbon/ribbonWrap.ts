// La cinta es infinita: la ranura k está en x = k · paso − desplazamiento y muestra la foto k mod N.
// Así se envuelve sin saltos con cualquier cantidad de fotos (también con 1 o 2). Funciones puras.

/** Resto siempre positivo. */
export const mod = (value: number, count: number): number => ((value % count) + count) % count;

/** Distancia con signo más corta entre dos fotos por el anillo de `count`. */
export function wrapSteps(delta: number, count: number): number {
  return count < 2 ? 0 : mod(delta + count / 2, count) - count / 2;
}

/** Foto (0 … N−1) más cercana al centro para un desplazamiento dado. */
export function nearestIndex(offset: number, pitch: number, count: number): number {
  return mod(Math.round(offset / pitch), count);
}

/** Objetivo de la foto anterior (−1) o siguiente (+1) a la que está más cerca del objetivo actual. */
export function stepTarget(target: number, pitch: number, step: number): number {
  return (Math.round(target / pitch) + step) * pitch;
}

/** Objetivo que centra la foto `index` por el camino más corto desde `target`. */
export function centerOn(index: number, target: number, pitch: number, count: number): number {
  const here = Math.round(target / pitch);
  return (here + wrapSteps(index - mod(here, count), count)) * pitch;
}

/** Ranuras cuyo centro cae a `range` o menos del centro de la pantalla. */
export function visibleSlots(offset: number, pitch: number, range: number): { first: number; last: number } {
  return { first: Math.ceil((offset - range) / pitch), last: Math.floor((offset + range) / pitch) };
}

/** Mallas que hacen falta para cubrir cualquier desplazamiento con ese rango. */
export function slotCount(pitch: number, range: number): number {
  return Math.floor((2 * range) / pitch) + 2;
}
