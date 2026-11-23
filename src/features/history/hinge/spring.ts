export interface Progress {
  position: number;
  velocity: number;
}

const FREQUENCY = 11;
const MAX_SPEED = 3; // unidades de progreso por segundo

/** Resorte crítico con avance acotado; `frequency` y `maxSpeed` ajustan el ritmo de cada uso. */
export function stepSpring(
  state: Progress, target: number, elapsed: number, frequency = FREQUENCY, maxSpeed = MAX_SPEED,
): Progress {
  const dt = Math.max(0, Math.min(elapsed, 1 / 30));
  const distance = target - state.position;
  const direction = Math.sign(distance);
  const remaining = Math.abs(distance);
  // Solución analítica crítica. Al invertir el destino, descarta el impulso que lo alejaría.
  const initialSpeed = Math.min(Math.max(0, direction * state.velocity), frequency * remaining);
  const decay = Math.exp(-frequency * dt);
  const slope = frequency * remaining - initialSpeed;
  const left = (remaining + slope * dt) * decay;
  const travel = Math.min(maxSpeed * dt, Math.max(0, remaining - left));
  // A menos de una milésima ya no hay diferencia visible: llega, se detiene y deja de pedir frames.
  if (remaining < 0.001 || (left < 0.0001 && remaining <= maxSpeed * dt)) return { position: target, velocity: 0 };
  return {
    position: state.position + direction * travel,
    velocity: direction * Math.min(maxSpeed, (initialSpeed + frequency * slope * dt) * decay),
  };
}
