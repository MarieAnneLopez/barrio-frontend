// H34 (D69): convierte el GeoJSON de los 14 módulos en capas dibujables de la maqueta.
// Puntos → sprites emoji; polígonos y líneas → segmentos de contorno. Cada capa cuenta
// cuántos lugares dibuja de verdad: ese número se compara con el de la base de datos.
import type { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import type { ModuleItem } from '../lib/apiTypes';
import { labelOf } from '../lib/moduleFields';
import type { Projection } from './projection';
import { SHAPE_Y as SHAPE_LINE_Y } from './referenceView';

export interface PlacePoint {
  id: number;
  name: string;
}

export interface CategoryLayer {
  slug: string;
  emoji: string;
  kind: 'points' | 'shapes';
  /** xyz por vértice (puntos) o por extremo de segmento (figuras). */
  positions: Float32Array;
  /** Solo en puntos: a qué lugar corresponde cada vértice. */
  items: PlacePoint[];
  /** Lugares dibujados (con geometría válida). */
  drawn: number;
}

export type ModuleCollection = FeatureCollection<Geometry | null, ModuleItem>;

const POINT_Y = 46;
const SHAPE_Y = SHAPE_LINE_Y; // por encima del zócalo de las manzanas (D83)

/** Anillos o trazos de una geometría de figura (cada uno es una polilínea). */
function strokes(geometry: Geometry): Position[][] {
  switch (geometry.type) {
    case 'LineString':
      return [geometry.coordinates];
    case 'MultiLineString':
    case 'Polygon':
      return geometry.coordinates;
    case 'MultiPolygon':
      return geometry.coordinates.flat();
    default:
      return [];
  }
}

function pushSegments(out: number[], line: Position[], project: Projection) {
  for (let i = 1; i < line.length; i++) {
    const [x0, z0] = project(line[i - 1] ?? []);
    const [x1, z1] = project(line[i] ?? []);
    out.push(x0, SHAPE_Y, z0, x1, SHAPE_Y, z1);
  }
}

/** Una capa por módulo; los puntos y las figuras de un mismo módulo no se mezclan. */
export function buildCategoryLayer(
  slug: string,
  emoji: string,
  collection: ModuleCollection,
  project: Projection,
): CategoryLayer {
  const features = collection.features.filter((f): f is Feature<Geometry, ModuleItem> => Boolean(f.geometry));
  const points = features.filter((f) => f.geometry.type === 'Point');
  if (points.length && points.length === features.length) {
    const positions = new Float32Array(points.length * 3);
    const items = points.map((f, i) => {
      const [x, z] = project((f.geometry as { coordinates: Position }).coordinates);
      positions.set([x, POINT_Y, z], i * 3);
      return { id: f.properties.id, name: labelOf(f.properties, slug) };
    });
    return { slug, emoji, kind: 'points', positions, items, drawn: points.length };
  }
  const segments: number[] = [];
  let drawn = 0;
  for (const feature of features) {
    const lines = strokes(feature.geometry).filter((line) => line.length > 1);
    if (!lines.length) continue;
    lines.forEach((line) => pushSegments(segments, line, project));
    drawn++;
  }
  return { slug, emoji, kind: 'shapes', positions: new Float32Array(segments), items: [], drawn };
}
