import { Color } from 'three';
import { mapColor, type MapToken } from '../../lib/cssToken';
import type { SkyState } from './cycle';

// Colores del cielo y de la luz según el ciclo (D106). La noche usa los roles medidos en la
// referencia (D83); el día y el atardecer, los suyos de styles/map-palette.css.

export interface SkyPalette {
  dayZenith: Color;
  dayHorizon: Color;
  duskZenith: Color;
  duskHorizon: Color;
  nightZenith: Color;
  nightHorizon: Color;
  sunLight: Color;
  moonLight: Color;
  dayAmbient: Color;
  nightAmbient: Color;
}

export interface SkyMix {
  zenith: Color;
  horizon: Color;
  /** Color de la luz directa (sol o luna) ya multiplicado por su intensidad. */
  light: Color;
  ambient: Color;
  /** Cuánto se nota el atardecer o el amanecer: 0 fuera de ellos, 1 en su punto medio. */
  dusk: number;
}

const read = (token: MapToken) => new Color(mapColor(token));

export function readSkyPalette(): SkyPalette {
  return {
    dayZenith: read('dia-cielo'),
    dayHorizon: read('dia-horizonte'),
    duskZenith: read('ciclo-cielo-atardecer'),
    duskHorizon: read('ciclo-atardecer'),
    nightZenith: read('fondo'),
    nightHorizon: read('manzana'),
    sunLight: read('dia-luz'),
    moonLight: read('ciclo-luz-luna'),
    dayAmbient: read('dia-ambiente'),
    nightAmbient: read('ciclo-ambiente-noche'),
  };
}

export function createSkyMix(): SkyMix {
  return { zenith: new Color(), horizon: new Color(), light: new Color(), ambient: new Color(), dusk: 0 };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const sunStrength = (s: SkyState) => clamp01(Math.sin(s.sunElevation) * 3);
const moonStrength = (s: SkyState) => clamp01(Math.sin(s.moonElevation) * 3) * 0.45;
/** El sol manda mientras ilumine más que la luna (en el atardecer y el amanecer están los dos). */
export const sunLeads = (s: SkyState): boolean => sunStrength(s) >= moonStrength(s);

/** Mezcla en `out` (sin crear objetos: se llama en cada cuadro). */
export function mixSky(state: SkyState, p: SkyPalette, out: SkyMix): SkyMix {
  const twilight = state.phase === 'atardecer' || state.phase === 'amanecer';
  out.dusk = twilight ? Math.sin(Math.PI * state.progress) : 0;
  out.zenith.copy(p.dayZenith).lerp(p.nightZenith, state.night).lerp(p.duskZenith, out.dusk * 0.6);
  out.horizon.copy(p.dayHorizon).lerp(p.nightHorizon, state.night).lerp(p.duskHorizon, out.dusk * 0.8);
  // La luz directa sigue al astro que está arriba; baja a cero cuando toca el horizonte.
  if (sunLeads(state)) out.light.copy(p.sunLight).lerp(p.duskHorizon, out.dusk * 0.5).multiplyScalar(sunStrength(state));
  else out.light.copy(p.moonLight).multiplyScalar(moonStrength(state));
  out.ambient.copy(p.dayAmbient).lerp(p.nightAmbient, state.night).multiplyScalar(0.55 + 0.25 * (1 - state.night));
  return out;
}

/** Dirección hacia el astro que ilumina (unitaria; y hacia arriba, x al este, z al sur). */
export function lightDirection(state: SkyState, out: { set(x: number, y: number, z: number): unknown }): void {
  const sun = sunLeads(state);
  const elevation = Math.max(0.15, sun ? state.sunElevation : state.moonElevation);
  const azimuth = sun ? state.sunAzimuth : state.moonAzimuth;
  // Sale por el este (x+) y se pone por el oeste (x−), pasando un poco al norte (z−): Bogotá, 4,6° N.
  const [x, y, z] = [Math.cos(azimuth) * Math.cos(elevation), Math.sin(elevation), -0.25 * Math.cos(elevation)];
  const length = Math.hypot(x, y, z);
  out.set(x / length, y / length, z / length);
}
