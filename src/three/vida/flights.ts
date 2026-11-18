import { hash01 } from '../streets/hash';

// Aviones sobre la isla (decorativos: no son datos): uno cada 1–3 min con un horario pseudoaleatorio
// determinista atado al reloj de pared (como el ciclo del cielo). El avión k sale en
// k · SLOT_S ± JITTER_S / 2, así que entre dos seguidos pasan entre 60 y 180 s.

export const SLOT_S = 120;
export const JITTER_S = 60;
/** Lo que tarda en cruzar (s). */
export const FLIGHT_S = 95;
/** Como mucho 2 a la vez: el siguiente sale al menos 60 s después y cada uno vuela 95 s. */
export const MAX_FLIGHTS = Math.ceil(FLIGHT_S / (SLOT_S - JITTER_S));

export const flightStart = (k: number) => k * SLOT_S + (hash01(k, 31) - 0.5) * JITTER_S;

/** Altura de vuelo (m): 300–380, muy por encima de los edificios (con su exageración vertical). */
export const flightAltitude = (k: number) => 300 + 80 * hash01(k, 11);

/** Aviones en el aire en el segundo `t`: escribe sus k en `out` y devuelve cuántos son. */
export function activeFlights(t: number, out: number[]): number {
  let n = 0;
  const first = Math.floor((t - FLIGHT_S - JITTER_S) / SLOT_S);
  for (let k = first; k <= Math.ceil(t / SLOT_S) + 1 && n < MAX_FLIGHTS; k++) {
    const start = flightStart(k);
    if (t >= start && t < start + FLIGHT_S) out[n++] = k;
  }
  return n;
}

/**
 * Pose del avión k en el segundo `t`: rumbo de las pistas de El Dorado (313° o 133° desde el norte)
 * ± 25°, pasando a menos de 60 m del punto `over` (x, z) a su altura de vuelo.
 */
export function flightPose(
  k: number, t: number, over: readonly [number, number], radius: number, out: { x: number; y: number; z: number; yaw: number },
): void {
  const heading = ((313 + (hash01(k, 5) - 0.5) * 50) * Math.PI) / 180 + (hash01(k, 9) < 0.5 ? Math.PI : 0);
  const [dx, dz] = [Math.sin(heading), -Math.cos(heading)]; // desde el norte, z al sur
  const lateral = (hash01(k, 7) - 0.5) * 120;
  const span = 2 * (radius + 900);
  const p = (t - flightStart(k)) / FLIGHT_S - 0.5;
  out.x = over[0] + dx * p * span - dz * lateral;
  out.z = over[1] + dz * p * span + dx * lateral;
  out.y = flightAltitude(k);
  out.yaw = Math.atan2(-dz, dx);
}

/**
 * Por dónde pasa el avión: donde la línea de mira de la cámara (p + t · d) cruza su altura de vuelo,
 * para que se vea cruzar el cuadro; si la cámara no baja hasta esa altura, el centro de la isla.
 * Siempre a menos de 0,8 · radio del centro.
 */
export function sightAnchor(
  p: readonly [number, number, number], d: readonly [number, number, number], altitude: number,
  center: readonly [number, number], radius: number,
): [number, number] {
  const t = d[1] < -0.02 ? (altitude - p[1]) / d[1] : -1;
  const [x, z] = t > 0 ? [p[0] + d[0] * t, p[2] + d[2] * t] : center;
  const away = Math.hypot(x - center[0], z - center[1]);
  const keep = Math.min(1, (0.8 * radius) / (away || 1));
  return [center[0] + (x - center[0]) * keep, center[1] + (z - center[1]) * keep];
}
