// Posiciones de la bienvenida: 8 Mini Marie desde los 8 puntos cardinales del
// viewport hasta un anillo seguro alrededor del letrero (sin taparlo).
import type { WelcomeGeometry } from './welcomeTimeline';

/** Dirección de cada punto: 4 esquinas, 2 laterales y centro arriba/abajo. */
export const WELCOME_SLOTS = [
  { id: 'sup-izq', dx: -1, dy: -1 },
  { id: 'sup-centro', dx: 0, dy: -1 },
  { id: 'sup-der', dx: 1, dy: -1 },
  { id: 'centro-der', dx: 1, dy: 0 },
  { id: 'inf-der', dx: 1, dy: 1 },
  { id: 'inf-centro', dx: 0, dy: 1 },
  { id: 'inf-izq', dx: -1, dy: 1 },
  { id: 'centro-izq', dx: -1, dy: 0 },
] as const;

const RING_X = 0.36; // fracción del ancho desde el centro
const RING_Y = 0.32; // fracción del alto desde el centro
const CONFETTI = 28;

/** Posición final de cada avatar en % del contenedor (para left/top). */
export function slotPosition(dx: number, dy: number): { left: string; top: string } {
  const corner = dx !== 0 && dy !== 0 ? 0.85 : 1; // las esquinas, un poco hacia dentro
  return {
    left: `${50 + dx * RING_X * 100 * corner}%`,
    top: `${50 + dy * RING_Y * 100 * corner}%`,
  };
}

export function welcomeGeometry(width: number, height: number): WelcomeGeometry {
  const avatarStarts = WELCOME_SLOTS.map(({ dx, dy }) => ({
    x: dx * width * 0.7,
    y: (dy === 0 ? 0.15 : dy) * height * 0.7,
  }));
  const reach = Math.min(width, height) * 0.38;
  const confettiTargets = Array.from({ length: CONFETTI }, (_, i) => {
    const angle = (i / CONFETTI) * Math.PI * 2 + (i % 3) * 0.09;
    const distance = reach * (0.55 + ((i * 37) % 45) / 100);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  });
  return { avatarStarts, confettiTargets };
}

export const CONFETTI_COUNT = CONFETTI;
