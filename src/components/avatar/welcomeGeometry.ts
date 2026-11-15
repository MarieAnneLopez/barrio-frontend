// Posiciones de la bienvenida (H33): Mini Marie grandes que se asoman desde los
// bordes de la pantalla y saludan con los 7 cuadros que dibujó Marie.
import type { WelcomeGeometry } from './welcomeTimeline';

export type PeekEdge = 'left' | 'right' | 'bottom';

/**
 * pose: cuadro fijo con movimiento reducido (índice desde 0; 2 = brazo arriba).
 * phase: desfase dentro del saludo (0–1), para que no se muevan al unísono.
 * mobile: en pantallas estrechas solo se asoman las de los lados.
 */
export const PEEK_SLOTS = [
  { id: 'izquierda', edge: 'left', pose: 2, phase: 0, mobile: true },
  { id: 'derecha', edge: 'right', pose: 3, phase: 0.35, mobile: true },
  { id: 'abajo', edge: 'bottom', pose: 4, phase: 0.6, mobile: false },
] as const satisfies readonly { id: string; edge: PeekEdge; pose: number; phase: number; mobile: boolean }[];

/** Desde dónde entra cada una, en % de su propio tamaño (xPercent / yPercent de GSAP). */
export function peekStart(edge: PeekEdge): { xPercent: number; yPercent: number } {
  if (edge === 'left') return { xPercent: -95, yPercent: 0 };
  if (edge === 'right') return { xPercent: 95, yPercent: 0 };
  return { xPercent: 0, yPercent: 70 };
}

const CONFETTI = 28;

export function welcomeGeometry(width: number, height: number): WelcomeGeometry {
  const reach = Math.min(width, height) * 0.38;
  const confettiTargets = Array.from({ length: CONFETTI }, (_, i) => {
    const angle = (i / CONFETTI) * Math.PI * 2 + (i % 3) * 0.09;
    const distance = reach * (0.55 + ((i * 37) % 45) / 100);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  });
  return { confettiTargets };
}

export const CONFETTI_COUNT = CONFETTI;
