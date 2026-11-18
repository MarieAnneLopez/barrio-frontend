import { ShapeUtils, Vector2 } from 'three';
import { TNT3, type Suelo } from '../data/format';
import type { DayNight, Sink } from './sink';

// Suelo del barrio (TNT3.suelo, OSM): el área «barrio» es la superficie de la isla en y = 0 y encima
// van parques y pasto, canchas, pistas y agua, en capas de pocos centímetros para que no parpadeen.

export type GroundKind = 'barrio' | 'verde' | 'cancha' | 'juegos' | 'pista' | 'agua';
export type GroundPalette = Record<GroundKind, DayNight>;

/** Altura de cada superficie (m): de abajo arriba. */
export const GROUND_Y: Record<GroundKind, number> = { barrio: 0, verde: 0.03, cancha: 0.045, juegos: 0.045, pista: 0.05, agua: 0.06 };

const S = TNT3.clasesSuelo;
const KIND: Record<number, GroundKind> = {
  [S.barrio]: 'barrio', [S.pitch]: 'cancha', [S.sports_centre]: 'cancha', [S.playground]: 'juegos', [S.track]: 'pista',
  [S.water]: 'agua', [S.wetland]: 'agua', [S.basin]: 'agua', [S.riverbank]: 'agua',
};

/** Parques, jardines, pasto, bosque y demás verdes caen en «verde». */
export const groundKind = (clase: number): GroundKind => KIND[clase] ?? 'verde';

/** Anillos del área `a` (el primero es el exterior; los demás, huecos). */
export function areaRings(s: Suelo, a: number): Float32Array[] {
  const rings: Float32Array[] = [];
  for (let r = s.areas[a] ?? 0; r < (s.areas[a + 1] ?? 0); r++) {
    rings.push(s.xz.subarray(2 * (s.anillos[r] ?? 0), 2 * (s.anillos[r + 1] ?? 0)));
  }
  return rings;
}

const toVectors = (ring: ArrayLike<number>) => Array.from({ length: ring.length >> 1 }, (_, i) => new Vector2(ring[2 * i] ?? 0, ring[2 * i + 1] ?? 0));

/** Triangula un polígono con huecos (earcut de three, tolera anillos que se tocan). */
export function triangulate(rings: ArrayLike<number>[]): { xz: number[]; index: number[] } {
  const [outer, ...holes] = rings.filter((r) => r.length >= 6);
  if (!outer) return { xz: [], index: [] };
  const contour = toVectors(outer);
  const holeVectors = holes.map(toVectors);
  const faces = ShapeUtils.triangulateShape(contour, holeVectors);
  const xz = [contour, ...holeVectors].flat().flatMap((v) => [v.x, v.y]);
  return { xz, index: faces.flat() };
}

/** Todas las áreas del suelo en `sink`, con el color y la altura de su clase. Devuelve triángulos. */
export function pushGround(sink: Sink, s: Suelo, palette: GroundPalette): number {
  const before = sink.triangles;
  for (let a = 0; a < s.count; a++) {
    const kind = groundKind(s.clase[a] ?? 0);
    const { xz, index } = triangulate(areaRings(s, a));
    const first = sink.vertices;
    for (let i = 0; i < xz.length; i += 2) sink.vertex(xz[i] ?? 0, GROUND_Y[kind], xz[i + 1] ?? 0, palette[kind]);
    for (let t = 0; t < index.length; t += 3) {
      sink.triangle(first + (index[t] ?? 0), first + (index[t + 1] ?? 0), first + (index[t + 2] ?? 0));
    }
  }
  return sink.triangles - before;
}
