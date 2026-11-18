import { TNT3, type Edificios } from '../data/format';
import { EXAGGERATION } from '../referenceView';

// Altura de los edificios (FORMATO §3): Catastro publica pisos, no metros. Fórmula de la maqueta:
//   y_abajo  = base × h          y_arriba = (base + pisos) × h
//   h = METERS_PER_LEVEL × EXAGGERATION = 3,2 m × 2 = 6,4 m dibujados por piso
// (el mismo criterio que la maqueta usa desde D83: 3,2 m por piso y la exageración vertical medida
// en la referencia). Sin pisos conocidos (12 edificios de OSM) se dibujan DEFAULT_LEVELS por regla;
// la ficha debe decir «pisos sin dato». Las subterráneas no asoman.

/** Altura real de un piso (m). */
export const METERS_PER_LEVEL = 3.2;
/** Altura dibujada de un piso (m): real × exageración vertical de la referencia. */
export const LEVEL_HEIGHT = METERS_PER_LEVEL * EXAGGERATION;
/** Pisos por regla cuando la fuente no los da (el mismo valor que usaba la capa OSM anterior). */
export const DEFAULT_LEVELS = 3;
/** Pretil (m dibujados): el techo va así de hundido bajo el remate del muro. Decorativo, no es dato. */
export const PARAPET = 1;
/** Clases de altura del tema de los mapas (map-palette.css): bajo < 4 ≤ medio < 7 ≤ alto. */
export const MEDIUM_FROM = 4;
export const TALL_FROM = 7;

export interface Volume {
  /** y del arranque del muro (m dibujados). */
  bottom: number;
  /** y del remate del muro (m dibujados). */
  top: number;
  levels: number;
  /** false si los pisos son la regla (sin dato de la fuente). */
  known: boolean;
}

type Columns = Pick<Edificios, 'pisos' | 'base' | 'banderas'>;

/** Volumen dibujado del edificio `b`; null si no tiene volumen visible. */
export function volumeOf(e: Columns, b: number, h: number = LEVEL_HEIGHT): Volume | null {
  const flags = e.banderas[b] ?? 0;
  if (flags & TNT3.banderasEdificio.subterranea) return null;
  const known = (flags & TNT3.banderasEdificio.pisosConocidos) !== 0;
  const levels = known ? (e.pisos[b] ?? 0) : DEFAULT_LEVELS;
  if (levels <= 0) return null;
  const base = e.base[b] ?? 0;
  return { bottom: base * h, top: (base + levels) * h, levels, known };
}

/**
 * Clase de altura del tema: 0 = remata hasta el piso 3, 1 = del 4 al 6, 2 = del 7 en adelante. Va
 * por el piso del remate (base + pisos), no por los pisos del volumen: así un voladizo toma la clase
 * de la casa que remata a su misma altura. El shader usa la misma expresión (HEIGHT_CLASS_GLSL),
 * desde el remate que lleva cada vértice.
 */
export function heightClass(volume: Pick<Volume, 'top'>, h: number = LEVEL_HEIGHT): 0 | 1 | 2 {
  const level = Math.floor(volume.top / h + 0.5);
  return level >= TALL_FROM ? 2 : level >= MEDIUM_FROM ? 1 : 0;
}

/** heightClass en GLSL (necesita `uniform float uLevel`, la altura dibujada de un piso). */
export const HEIGHT_CLASS_GLSL = /* glsl */ `
float topLevel(float top) {
  return floor(top / uLevel + 0.5);
}
int heightClass(float level) {
  return level >= ${TALL_FROM.toFixed(1)} ? 2 : (level >= ${MEDIUM_FROM.toFixed(1)} ? 1 : 0);
}
`;
