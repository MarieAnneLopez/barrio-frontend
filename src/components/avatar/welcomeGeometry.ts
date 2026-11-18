// Posiciones de la bienvenida (H33, D82): 8 Mini Marie que salen desde fuera de la pantalla
// por sus esquinas y el centro de sus bordes, de cabeza hacia adentro, y saludan.
import type { WelcomeGeometry } from './welcomeTimeline';
import { placePeeks, SLOTS, type PeekSlot, type Size } from './welcomePeeks';

/**
 * pose: cuadro fijo con movimiento reducido (índice desde 0; 1–4 = brazo arriba).
 * phase: desfase dentro del saludo (0–1), para que no se muevan al unísono.
 */
const POSES = [1, 2, 3, 4, 2, 3, 1, 4];
export const PEEK_SLOTS = SLOTS.map((id, i) => ({ id, pose: POSES[i] ?? 2, phase: ((i * 3) % 8) / 8 }));

/** Pantalla visible de verdad: visualViewport, que ya descuenta la barra de scroll (jsdom no la tiene). */
export function viewportSize(): Size {
  const visual = typeof window.visualViewport === 'object' ? window.visualViewport : null;
  const root = document.documentElement;
  return {
    w: visual?.width || root.clientWidth || window.innerWidth,
    h: visual?.height || root.clientHeight || window.innerHeight,
  };
}

/** Ancla cada Mini Marie en su esquina o en el centro de su borde (left/top en px enteros, D86). */
export function layoutPeeks(root: HTMLElement): void {
  const placed = placePeeks(viewportSize());
  root.querySelectorAll<HTMLElement>('.welcome-peek').forEach((el) => {
    const spot = placed[el.dataset.slot as PeekSlot];
    if (!spot) return;
    el.style.left = `${Math.round(spot.x)}px`;
    el.style.top = `${Math.round(spot.y)}px`;
    el.style.transform = `rotate(${spot.rotation}deg)`; // cabeza siempre hacia adentro
    el.dataset.diagonal = String(spot.rotation % 90 !== 0); // a 45° no hay píxel entero: se suaviza
  });
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
