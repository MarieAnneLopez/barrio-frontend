// Recorrido del capítulo: la sección mide 300svh y su pantalla sticky 100svh, así que quedan 200svh
// de scroll nativo que se convierten en avance por los 14 módulos. Nunca se intercepta el scroll:
// solo se lee dónde va y, tras una navegación explícita, se lleva la página a donde corresponde.
import { mod } from './reelMath';
import type { Motion } from './reelMotion';
import { nearestTurn } from './reelPhase';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Avance 0 … 1 dentro del recorrido. `top` es el borde superior de la sección en pantalla. */
export function travelProgress(top: number, travel: number): number {
  return travel > 0 ? clamp01(-top / travel) : 0;
}

/** Índice flotante que corresponde a un avance: del primer módulo al último. */
export const travelIndex = (progress: number, count: number): number => progress * (count - 1);

/** Scroll, desde el inicio del recorrido, que deja centrado el módulo `index` (envuelto al anillo). */
export function travelOffset(index: number, count: number, travel: number): number {
  return (mod(index, count) / (count - 1)) * travel;
}

/** Dónde va la sección y cuánto recorrido deja su pantalla sticky (0 con movimiento reducido). */
export function readTravel(section: HTMLElement, stage: HTMLElement): { top: number; travel: number } {
  return { top: section.getBoundingClientRect().top, travel: section.offsetHeight - stage.offsetHeight };
}

/**
 * Tras una navegación explícita (teclas, arrastre, clic) lleva el scroll al punto del módulo, para que
 * seguir bajando continúe desde ahí. Es un salto sin animación dentro de la pantalla sticky: no se ve.
 */
export function syncScroll(section: HTMLElement, stage: HTMLElement, index: number, count: number): void {
  const { top, travel } = readTravel(section, stage);
  if (travel <= 0) return;
  window.scrollTo({ top: window.scrollY + top + travelOffset(index, count, travel), behavior: 'instant' });
}

/**
 * Lector del scroll del capítulo: cada vez que cambia, lo convierte en el objetivo del reel por el
 * camino corto del anillo. Si no cambia, deja el objetivo como esté (lo puede haber movido el usuario).
 */
export function createFollower(section: HTMLElement, stage: HTMLElement, motion: Motion, count: number): () => void {
  let progress = -1;
  return () => {
    const { top, travel } = readTravel(section, stage);
    const next = travelProgress(top, travel);
    if (travel > 0 && Math.abs(next - progress) > 1e-4) {
      motion.target = nearestTurn(travelIndex(next, count), motion.target, count);
      motion.rest = 0;
    }
    progress = next;
  };
}
