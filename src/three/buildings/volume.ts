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

/** 0 = hasta 3 pisos, 1 = de 4 a 6, 2 = 7 o más (el shader usa los mismos umbrales). */
export function heightClass(levels: number): 0 | 1 | 2 {
  return levels >= TALL_FROM ? 2 : levels >= MEDIUM_FROM ? 1 : 0;
}
