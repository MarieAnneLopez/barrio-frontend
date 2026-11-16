// Cámara y escala de la maqueta, medidas con scripts en "Barrio 3d ejemplo.jpeg" (D83).
// Lo medido: inclinación, giro respecto a la malla vial, encuadre (calles por ancho de imagen) y
// extrusión relativa. Lo asumido se dice en cada constante.
import type { Feature, Geometry } from 'geojson';
import { Vector3 } from 'three';
import type { Projection } from './projection';

/** Inclinación desde la vertical (0 = cenital): calles de la referencia a 28,99° y −27,99°. */
export const PITCH_DEG = 57.1;
/** Giro de la cámara respecto a la malla vial (casi isométrica). */
export const GRID_BEARING_DEG = 44.4;
/** La referencia no muestra convergencia (≤ 0,1° entre cuadrantes): perspectiva muy estrecha (asumido 10°). */
export const FOV_DEG = 10;
/** Encuadre: 5,8 separaciones entre calles caben en el ancho de la referencia. */
export const PERIODS_ACROSS = 5.8;
/** Ancho de vía que se suma a la manzana mediana para la separación entre calles (asumido). */
const STREET_WIDTH_M = 12;
/** Altura típica de edificio en la referencia = 0,17 × separación entre calles → exageración vertical. */
export const EXAGGERATION = 2;
/** Zócalo esquemático de las manzanas (m): igual para todas, no es un dato de altura. */
export const PODIUM = 4;
/** Capas a ras de suelo, de abajo arriba: lotes, vías y parques. */
export const LOT_Y = 0.2;
export const STREET_Y = 0.4;
export const PARK_Y = 0.9;
export const PATH_Y = PODIUM + 0.25;
export const SHAPE_Y = PODIUM + 0.6;

type Lines = Feature<Geometry | null>;
const segments = (f: Lines): number[][][] =>
  f.geometry?.type === 'LineString' ? [f.geometry.coordinates] : f.geometry?.type === 'MultiLineString' ? f.geometry.coordinates : [];

/** Azimut dominante de la malla vial (0–90°, desde el norte), ponderado por longitud. */
export function gridAzimuth(roads: readonly Lines[], project: Projection): number {
  const hist = new Float64Array(90);
  for (const road of roads) for (const line of segments(road)) for (let i = 0; i < line.length - 1; i++) {
    const [x1, z1] = project(line[i] ?? []);
    const [x2, z2] = project(line[i + 1] ?? []);
    const az = (((Math.atan2(x2 - x1, z1 - z2) * 180) / Math.PI) % 90 + 90) % 90;
    hist[Math.floor(az) % 90] = (hist[Math.floor(az) % 90] ?? 0) + Math.hypot(x2 - x1, z2 - z1);
  }
  const smooth = (a: number) => [-2, -1, 0, 1, 2].reduce((t, d) => t + (hist[(a + d + 90) % 90] ?? 0), 0);
  let best = 0;
  for (let a = 1; a < 90; a++) if (smooth(a) > smooth(best)) best = a;
  return best;
}

export interface HomeView { target: Vector3; position: Vector3; distance: number }

/** Encuadre inicial: misma inclinación y giro que la referencia, y las mismas calles por ancho de imagen. */
export function homeView(grid: number, spot: readonly [number, number], blockSize: number, aspect: number): HomeView {
  const width = PERIODS_ACROSS * (blockSize + STREET_WIDTH_M);
  const distance = width / (2 * Math.tan((FOV_DEG * Math.PI) / 360) * Math.max(aspect, 0.9));
  const heading = ((grid - GRID_BEARING_DEG) * Math.PI) / 180; // hacia dónde mira, desde el norte
  const pitch = (PITCH_DEG * Math.PI) / 180;
  const target = new Vector3(spot[0], 0, spot[1]);
  const back = new Vector3(-Math.sin(heading) * Math.sin(pitch), Math.cos(pitch), Math.cos(heading) * Math.sin(pitch));
  return { target, position: target.clone().addScaledVector(back, distance), distance };
}
