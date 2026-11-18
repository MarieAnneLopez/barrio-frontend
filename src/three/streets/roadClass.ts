import { TNT3 } from '../data/format';

// Reglas de dibujo de las vías (no son datos): OSM trae la clase, el sentido y a veces carriles y
// velocidad; lo que falta (ancho de carril, andenes, marcas) sale de estas tablas por clase.

const C = TNT3.clasesVia;
const B = TNT3.banderasVia;

/** Lo que la escena lee de cada tramo (columnas de TNT3.vias en el índice del tramo). */
export interface WayTags { clase: number; banderas: number; sentido: number; carriles: number; vmax: number }

/** Marcas de la calzada (bits). */
export const CAR_STYLE = { lanes: 1, center: 2, double: 4, edges: 8 } as const;

export interface RoadSpec {
  lanes: number;
  /** Ancho de la calzada y su mitad (m). */
  width: number;
  half: number;
  /** Ancho de cada andén (m); 0 sin andén. */
  sidewalk: number;
  /** Orden en los cruces: la más importante queda encima. */
  rank: number;
  /** Brillo de noche, 0–1 (más en avenidas). */
  glow: number;
  style: number;
  /** km/h: vmax de OSM o la regla de la clase. */
  speed: number;
}

/** [carriles, ancho de carril, andén, rango, brillo, km/h] por clase vehicular (regla de dibujo). */
const CAR: Record<number, readonly [number, number, number, number, number, number]> = {
  [C.motorway]: [3, 3.6, 0, 6, 1, 80],
  [C.trunk]: [3, 3.5, 3, 6, 1, 60],
  [C.primary]: [3, 3.5, 3, 5, 1, 50],
  [C.secondary]: [2, 3.4, 3, 4, 0.85, 50],
  [C.tertiary]: [2, 3.3, 2.5, 3, 0.6, 40],
  [C.unclassified]: [2, 3, 2, 2, 0.3, 30],
  [C.residential]: [2, 3, 2, 2, 0.3, 30],
  [C.living_street]: [1, 4, 1.5, 1, 0.2, 20],
  [C.service]: [1, 4.5, 1, 1, 0.12, 20],
  [C.busway]: [1, 3.6, 0, 2, 0.6, 50],
  [C.road]: [2, 3, 2, 2, 0.3, 30],
  [C.construction]: [2, 3.3, 0, 0, 0, 0],
};

export const isCarClass = (clase: number) => clase >= C.motorway && clase <= C.construction;

/** Calzada que se dibuja: vehicular (también en obra), sin túneles ni áreas cerradas. */
export const isCarDrawn = (t: WayTags) => isCarClass(t.clase) && !(t.banderas & (B.tunel | B.area));

/** Por donde andan los carros (FORMATO §4): 1–11 sin solo bus, acceso restringido, túnel ni área. */
export const isCarDriven = (t: WayTags) =>
  t.clase >= C.motorway && t.clase <= C.road && t.clase !== C.busway
  && !(t.banderas & (B.soloBus | B.accesoRestringido | B.tunel | B.area));

export function roadSpec(t: WayTags): RoadSpec {
  const [lanesByClass, laneWidth, sidewalk, rank, glow, speed] = CAR[t.clase] ?? CAR[C.residential] ?? [2, 3, 2, 2, 0.45, 30];
  const lanes = t.carriles > 0 ? t.carriles : lanesByClass;
  const width = Math.max(3.5, lanes * laneWidth);
  const oneWay = t.sentido !== 0;
  let style = 0;
  if (rank >= 2 && t.clase !== C.busway) {
    if (oneWay) style |= lanes > 1 ? CAR_STYLE.lanes : 0;
    else style |= rank >= 3 ? CAR_STYLE.double : CAR_STYLE.center;
    if (rank >= 4) style |= CAR_STYLE.edges;
  }
  return { lanes, width, half: width / 2, sidewalk, rank, glow, style, speed: t.vmax > 0 ? t.vmax : speed };
}

export type FootSurface = 'anden' | 'ciclo' | 'tierra';

/** [ancho (m), superficie] de las vías peatonales y de bici; corridor (interiores) no se dibuja. */
const FOOT: Record<number, readonly [number, FootSurface]> = {
  [C.footway]: [2, 'anden'], [C.sidewalk]: [2.4, 'anden'], [C.crossing]: [3, 'anden'], [C.path]: [1.6, 'tierra'],
  [C.pedestrian]: [4, 'anden'], [C.steps]: [2.2, 'anden'], [C.cycleway]: [2.4, 'ciclo'], [C.track]: [3, 'tierra'],
  [C.bridleway]: [1.6, 'tierra'],
};

export function footSpec(clase: number): { width: number; surface: FootSurface } | null {
  const row = FOOT[clase];
  return row ? { width: row[0], surface: row[1] } : null;
}
