// Ciclo de día y noche de la maqueta (gran actualización): 5 min de día, atardecer lento, 5 min de
// noche, amanecer lento, y vuelve a empezar. Va con el reloj de pared (Date.now): al navegar entre
// secciones no se reinicia. Función pura: el cielo, las luces, las ventanas, los faroles, los carros
// y el tono de la interfaz del mapa leen lo mismo.

export const DAY_MS = 5 * 60_000;
export const DUSK_MS = 90_000;
export const NIGHT_MS = 5 * 60_000;
export const DAWN_MS = 90_000;
export const CYCLE_MS = DAY_MS + DUSK_MS + NIGHT_MS + DAWN_MS;
/** Con movimiento reducido el ciclo queda quieto a media mañana. */
export const STILL_MS = DAY_MS * 0.4;

export type SkyPhase = 'dia' | 'atardecer' | 'noche' | 'amanecer';

export interface SkyState {
  phase: SkyPhase;
  /** Avance dentro de la fase, de 0 a 1. */
  progress: number;
  /** 0 de día y 1 de noche; en el atardecer y el amanecer cambia suave (smoothstep). */
  night: number;
  /** Altura del sol en radianes: máxima a mediodía, 0 en el horizonte, negativa de noche. */
  sunElevation: number;
  /** Azimut del sol en radianes: sale por el este (0) y se pone por el oeste (π). */
  sunAzimuth: number;
  moonElevation: number;
  moonAzimuth: number;
}

const MAX_ELEVATION = (62 * Math.PI) / 180;
const BELOW = (8 * Math.PI) / 180; // al empezar el amanecer y al terminar el atardecer, bajo el horizonte
const smooth = (t: number) => t * t * (3 - 2 * t);
const wrap = (ms: number) => ((ms % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;

/** Arco de un astro que está arriba durante `span` ms y lleva `at` ms en él: [altura, azimut]. */
function arc(at: number, span: number): [number, number] {
  const s = Math.min(1, Math.max(0, at / span));
  return [Math.sin(Math.PI * s) * (MAX_ELEVATION + BELOW) - BELOW, Math.PI * s];
}

/** Estado del cielo en el instante `ms` (Date.now() o STILL_MS). */
export function skyAt(ms: number): SkyState {
  const t = wrap(ms);
  const sunSpan = DAWN_MS + DAY_MS + DUSK_MS;
  const moonSpan = DUSK_MS + NIGHT_MS + DAWN_MS;
  // El sol sale al empezar el amanecer (al final del ciclo) y se pone al terminar el atardecer;
  // la luna sale al empezar el atardecer y se pone al terminar el amanecer.
  const sunAt = t >= CYCLE_MS - DAWN_MS ? t - (CYCLE_MS - DAWN_MS) : t + DAWN_MS;
  const moonAt = t - DAY_MS; // negativo de día
  const down: [number, number] = [-BELOW - 0.5, Math.PI];
  const [sunElevation, sunAzimuth] = sunAt <= sunSpan ? arc(sunAt, sunSpan) : down;
  const [moonElevation, moonAzimuth] = moonAt >= 0 ? arc(moonAt, moonSpan) : down;
  let phase: SkyPhase = 'dia';
  let progress = t / DAY_MS;
  let night = 0;
  if (t >= DAY_MS && t < DAY_MS + DUSK_MS) {
    phase = 'atardecer';
    progress = (t - DAY_MS) / DUSK_MS;
    night = smooth(progress);
  } else if (t >= DAY_MS + DUSK_MS && t < DAY_MS + DUSK_MS + NIGHT_MS) {
    phase = 'noche';
    progress = (t - DAY_MS - DUSK_MS) / NIGHT_MS;
    night = 1;
  } else if (t >= DAY_MS + DUSK_MS + NIGHT_MS) {
    phase = 'amanecer';
    progress = (t - DAY_MS - DUSK_MS - NIGHT_MS) / DAWN_MS;
    night = 1 - smooth(progress);
  }
  return { phase, progress, night, sunElevation, sunAzimuth, moonElevation, moonAzimuth };
}
