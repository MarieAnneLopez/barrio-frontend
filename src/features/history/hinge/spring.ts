export interface Progress {
  position: number;
  velocity: number;
}

const FREQUENCY = 11;
const MAX_SPEED = 3; // hitos por segundo

export function stepSpring(state: Progress, target: number, elapsed: number): Progress {
  const dt = Math.max(0, Math.min(elapsed, 1 / 30));
  const distance = target - state.position;
  const direction = Math.sign(distance);
  const remaining = Math.abs(distance);
  // Solución analítica crítica. Al invertir el destino, descarta el impulso que lo alejaría.
  const initialSpeed = Math.min(Math.max(0, direction * state.velocity), FREQUENCY * remaining);
  const decay = Math.exp(-FREQUENCY * dt);
  const slope = FREQUENCY * remaining - initialSpeed;
  const left = (remaining + slope * dt) * decay;
  const travel = Math.min(MAX_SPEED * dt, Math.max(0, remaining - left));
  if (left < 0.0001 && remaining <= MAX_SPEED * dt) return { position: target, velocity: 0 };
  return {
    position: state.position + direction * travel,
    velocity: direction * Math.min(MAX_SPEED, (initialSpeed + FREQUENCY * slope * dt) * decay),
  };
}
