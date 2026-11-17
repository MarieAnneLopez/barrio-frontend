// Estado del reel y su avance cuadro a cuadro: la fase persigue al objetivo, el impulso de la rueda
// se apaga solo y, sin entrada, el reel asienta en el módulo más cercano. Sin DOM ni three.
import { bendFor } from './reelBend';
import { dampStep, settleIndex } from './reelPhase';

export interface Motion {
  /** Índice flotante amortiguado: lo que se dibuja. */
  phase: number;
  /** Adonde va: lo fijan el scroll del capítulo, el arrastre y las teclas. */
  target: number;
  /** Empujón de la rueda (−1 … 1), que se apaga solo. */
  impulse: number;
  /** Módulos por segundo, suavizado. */
  speed: number;
  /** Reloj de la ondulación; con movimiento reducido no avanza. */
  time: number;
  /** Segundos desde la última entrada. */
  rest: number;
  /** Se está arrastrando: no se asienta hasta soltar. */
  held: boolean;
}

export const createMotion = (): Motion => ({ phase: 0, target: 0, impulse: 0, speed: 0, time: 0, rest: 0, held: false });

/** Segundos sin entrada antes de asentar en el módulo más cercano. */
export const SETTLE_AFTER = 0.14;
/** Módulos que el impulso máximo adelanta a la fase. */
export const LEAD = 0.12;
/** Inclinación máxima por velocidad, en radianes. */
export const TILT_LIMIT = 0.08;
const IMPULSE_FADE = 4; // 1/s
const FAST_SPEED = 6; // módulos por segundo que ya cuentan como entrada rápida
const TILT_PER_SPEED = 0.012;
const SPEED_SMOOTHING = 0.25;

/**
 * Avanza un cuadro. `dt` llega ya limitado; dt = 0 es el primer cuadro tras una pausa y coloca la
 * fase sin animar. Con movimiento reducido no hay nada autónomo: la fase es el objetivo, al instante.
 */
export function stepMotion(motion: Motion, dt: number, reduced: boolean): void {
  motion.rest += dt;
  if (!motion.held && motion.rest >= SETTLE_AFTER) motion.target = settleIndex(motion.target);
  motion.impulse = reduced ? 0 : motion.impulse * Math.exp(-IMPULSE_FADE * dt);
  const goal = motion.target + motion.impulse * LEAD;
  const instant = reduced || dt === 0;
  const next = instant ? goal : dampStep(motion.phase, goal, dt);
  motion.speed = instant ? 0 : motion.speed + ((next - motion.phase) / dt - motion.speed) * SPEED_SMOOTHING;
  motion.phase = next;
  if (!reduced) motion.time += dt;
}

/** Curvatura de las tarjetas: 0,30 en reposo y hasta 0,42 con entrada rápida (velocidad o rueda). */
export function bendOf(motion: Motion): number {
  return bendFor(Math.abs(motion.speed) / FAST_SPEED + Math.abs(motion.impulse));
}

/** Inclinación leve por velocidad, con tope. */
export function tiltOf(motion: Motion): number {
  return Math.min(TILT_LIMIT, Math.max(-TILT_LIMIT, motion.speed * TILT_PER_SPEED));
}
