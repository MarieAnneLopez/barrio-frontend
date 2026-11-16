// Posiciones de la bienvenida (H33, D82): 8 Mini Marie que salen desde fuera de la pantalla
// por sus esquinas y bordes, de cabeza hacia adentro, y saludan con los 7 cuadros de Marie.
import type { WelcomeGeometry } from './welcomeTimeline';
import { placePeeks, SLOTS, type PeekSlot, type Rect } from './welcomePeeks';

/**
 * pose: cuadro fijo con movimiento reducido (índice desde 0; 1–4 = brazo arriba).
 * phase: desfase dentro del saludo (0–1), para que no se muevan al unísono.
 */
const POSES = [1, 2, 3, 4, 2, 3, 1, 4];
export const PEEK_SLOTS = SLOTS.map((id, i) => ({ id, pose: POSES[i] ?? 2, phase: ((i * 3) % 8) / 8 }));

/** Obstáculos que ninguna puede tapar: letrero, botón, chat, WhatsApp y barra de accesibilidad. */
const OBSTACLES = '#welcome-sign, .welcome-cta, .chat-launcher, .ui-whatsapp, aside.fixed';

/** Mide la pantalla y los obstáculos y ancla cada Mini Marie (left/top en px). */
export function layoutPeeks(root: HTMLElement): void {
  const body = root.querySelector<HTMLElement>('.welcome-peek__body');
  const sprite = { w: body?.offsetWidth ?? 0, h: body?.offsetHeight ?? 0 };
  const rects: Rect[] = [...document.querySelectorAll(OBSTACLES)]
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0);
  const placed = placePeeks({ w: window.innerWidth, h: window.innerHeight }, sprite, rects);
  root.querySelectorAll<HTMLElement>('.welcome-peek').forEach((el) => {
    const spot = placed[el.dataset.slot as PeekSlot];
    if (!spot) return;
    el.style.left = `${spot.x}px`;
    el.style.top = `${spot.y}px`;
    el.style.transform = `rotate(${spot.rotation}deg)`; // cabeza siempre hacia adentro
    el.dataset.shifted = String(spot.shifted);
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
