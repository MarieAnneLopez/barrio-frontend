// Matemática pura de la pista del reel (capítulo 4): cada tarjeta se coloca según su distancia
// con signo a la fase (`relative`), sobre una hélice elíptica. Sin DOM ni three: se prueba con números.

/** Ángulo entre dos tarjetas seguidas: theta = relative · 0,73. */
export const STEP_ANGLE = 0.73;
/** Salto vertical entre dos tarjetas seguidas, por unidad de escala. */
export const PITCH = 0.52;
/** Desplazamiento en z de toda la pista. */
export const DEPTH_OFFSET = -0.28;
/** Inclinación en X por cada módulo de distancia al centro. */
const LEAN = -0.01;

export interface Track {
  /** trackRadius: semieje horizontal de la elipse. */
  radius: number;
  /** trackDepth: semieje hacia la cámara. */
  depth: number;
  /** Salto vertical por módulo (0,52 · escala). */
  pitch: number;
}

export interface Pose {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
}

/** Resto siempre positivo. */
export const mod = (value: number, count: number): number => ((value % count) + count) % count;

/** Distancia con signo de una tarjeta a la fase, envuelta a [−N/2, N/2): el anillo no tiene principio. */
export function wrapRelative(value: number, count: number): number {
  return mod(value + count / 2, count) - count / 2;
}

/**
 * Postura de la tarjeta que está a `relative` módulos del centro. El giro en Y sigue la tangente de
 * la elipse, así que las del lado de atrás quedan de espaldas y no se dibujan (caras traseras ocultas).
 * `tilt` es la inclinación leve que añade la velocidad.
 */
export function cardPose(relative: number, track: Track, tilt = 0): Pose {
  const theta = relative * STEP_ANGLE;
  const [sin, cos] = [Math.sin(theta), Math.cos(theta)];
  return {
    x: sin * track.radius,
    y: relative * track.pitch,
    z: cos * track.depth + DEPTH_OFFSET,
    rotationX: LEAN * relative + tilt,
    rotationY: Math.atan2(track.depth * sin, track.radius * cos),
  };
}
