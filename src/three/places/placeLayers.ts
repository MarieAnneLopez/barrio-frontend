// Lugares de los 14 módulos que dibuja la maqueta (gran actualización; antes categoryLayers, H34).
// Solo registros reales: los «dato de ejemplo» siguen en la lista del panel con su etiqueta, pero no
// se dibujan (CLAUDE.md, D105). Cada lugar lleva un marcador (el punto, o el centro de su figura) y
// las figuras (zonas, canchas, calles, lotes) dibujan además su contorno; los lotes y los tramos de
// calle, en su sección, se eligen en el suelo en vez de llevar un marcador cada uno (placeShapes).
import type { FeatureCollection, Geometry, Position } from 'geojson';
import type { ModuleItem } from '../../lib/apiTypes';
import { placeCenter } from '../../lib/placeCenter';
import { isSampleRecord } from '../../lib/verification';
import type { Projection } from '../projection';
import { SHAPE_Y } from '../referenceView';
import { shapeCollector, type PlaceShapes } from './placeShapes';

export type ModuleCollection = FeatureCollection<Geometry | null, ModuleItem>;

export interface PlaceLayer {
  slug: string;
  emoji: string;
  /** xyz de cada marcador: el punto o el centro de la figura. */
  markers: Float32Array;
  /** Id en la API del lugar de cada marcador, en el mismo orden. */
  ids: number[];
  /** Contorno de las figuras: pares de extremos xyz. */
  outline: Float32Array;
  /** Lugares reales dibujados (con geometría y que no son de ejemplo): la leyenda los cuenta. */
  drawn: number;
  /** Figuras que se eligen en el suelo (lotes y tramos en su sección); null: se eligen por marcador. */
  shapes: PlaceShapes | null;
}

/**
 * Altura de los marcadores (m): la de los contornos. Se dibujan encima de todo (depthTest apagado),
 * así que subirlos no los hace más visibles: solo los corre en pantalla (a 46 m caían ~41 m al
 * norte de su lugar con la inclinación de los mapas; markerAnchor.test.ts).
 */
export const MARKER_Y = SHAPE_Y;

/** Anillos o trazos de una figura (cada uno es una polilínea). */
function strokes(geometry: Geometry): Position[][] {
  if (geometry.type === 'LineString') return [geometry.coordinates];
  if (geometry.type === 'MultiLineString' || geometry.type === 'Polygon') return geometry.coordinates;
  return geometry.type === 'MultiPolygon' ? geometry.coordinates.flat() : [];
}

function pushSegments(out: number[], line: Position[], project: Projection) {
  for (let i = 1; i < line.length; i++) {
    const [x0, z0] = project(line[i - 1] ?? []);
    const [x1, z1] = project(line[i] ?? []);
    out.push(x0, SHAPE_Y, z0, x1, SHAPE_Y, z1);
  }
}

/**
 * Capa de un módulo. `shapeMarkers` en false deja las figuras solo con su contorno (los 3 700 lotes
 * fuera de su propio módulo); `pickShapes` las indexa para elegirlas en el suelo (placeShapes).
 */
export function buildPlaceLayer(
  slug: string,
  emoji: string,
  collection: ModuleCollection,
  project: Projection,
  { shapeMarkers, pickShapes = false }: { shapeMarkers: boolean; pickShapes?: boolean },
): PlaceLayer {
  const markers: number[] = [];
  const ids: number[] = [];
  const outline: number[] = [];
  const shapes = pickShapes ? shapeCollector() : null;
  let drawn = 0;
  const mark = (id: number, [x, z]: [number, number]) => {
    markers.push(x, MARKER_Y, z);
    ids.push(id);
  };
  for (const { geometry, properties } of collection.features) {
    if (!geometry || !properties || isSampleRecord(properties)) continue;
    if (geometry.type === 'Point') {
      mark(properties.id, project(geometry.coordinates));
      drawn++;
      continue;
    }
    const lines = strokes(geometry).filter((line) => line.length > 1);
    if (!lines.length) continue;
    const before = outline.length;
    lines.forEach((line) => pushSegments(outline, line, project));
    drawn++;
    const center = shapeMarkers || shapes ? placeCenter(geometry) : null;
    if (!center) continue;
    const [x, z] = project([center.lon, center.lat]);
    if (shapeMarkers) mark(properties.id, [x, z]);
    shapes?.add(properties.id, geometry.type.endsWith('Polygon'), [x, MARKER_Y, z], (outline.length - before) / 6);
  }
  const done = { markers: new Float32Array(markers), outline: new Float32Array(outline), shapes: shapes?.done() ?? null };
  return { slug, emoji, ids, drawn, ...done };
}
