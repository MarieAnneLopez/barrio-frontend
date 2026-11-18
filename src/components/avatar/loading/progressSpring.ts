// Barra de carga viva (gran actualización): el relleno sigue el progreso real con un muelle suave,
// casi críticamente amortiguado (ζ ≈ 0,95), así llega rápido sin pasarse. Sin DOM.
export interface Spring {
  /** Avance mostrado, de 0 a 1. */
  x: number;
  /** Velocidad (avance por segundo). */
  v: number;
}

const STIFFNESS = 150;
const DAMPING = 23; // 2 · ζ · √k con ζ ≈ 0,94
/** Un cuadro que llega tarde avanza como mucho esto (s). */
const MAX_DT = 0.05;
/** Lo mínimo que se ve de la barra al aparecer: una astilla. */
export const START = 0.06;

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

/** Un paso del muelle hacia `target` (Euler semiimplícito, estable con dt ≤ 50 ms). */
export function springStep(state: Spring, target: number, dt: number): Spring {
  const h = Math.min(Math.max(dt, 0), MAX_DT);
  const accel = -STIFFNESS * (state.x - target) - DAMPING * state.v;
  const v = state.v + accel * h;
  return { x: clamp(state.x + v * h), v };
}

/** ¿Ya llegó? (para soltar el rAF) */
export const settled = (state: Spring, target: number): boolean =>
  Math.abs(state.x - target) < 1e-3 && Math.abs(state.v) < 1e-3;

export interface LoadState {
  /** Hay algo que justifica la pantalla: arranque, chunks o datos. */
  busy: boolean;
  /** Hay tareas con avance medible (loadingStore). */
  active: boolean;
  /** Avance medio de esas tareas, 0 a 1. */
  progress: number;
}

/** Nuevo objetivo: el avance real de las tareas, sin retroceder; lleno cuando ya no queda nada. */
export function nextTarget(current: number, { busy, active, progress }: LoadState): number {
  if (!busy) return 1;
  if (!active) return current;
  return Math.max(current, START + (1 - START) * progress * 0.96);
}
