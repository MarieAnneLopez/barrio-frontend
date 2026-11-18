// Lugares de los 14 módulos que dibuja la maqueta (gran actualización; antes categoryLayers, H34).
// Solo registros reales: los «dato de ejemplo» siguen en la lista del panel con su etiqueta, pero no
// se dibujan (CLAUDE.md, D105). Cada lugar lleva un marcador (el punto, o el centro de su figura) y
// las figuras (zonas, canchas, calles, lotes) dibujan además su contorno.
import type { FeatureCollection, Geometry, Position } from 'geojson';
import type { ModuleItem } from '../../lib/apiTypes';
import { placeCenter } from '../../lib/placeCenter';
import { isSampleRecord } from '../../lib/verification';
import type { Projection } from '../projection';
import { SHAPE_Y } from '../referenceView';

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
}

/**
 * Altura de los marcadores (m): la de los contornos. Se dibujan encima de todo (depthTest apagado),
 * así que subirlos no los hace más visibles: solo los corre en pantalla (a 46 m caían ~41 m al
 * norte de su lugar con la inclinación de los mapas; markerAnchor.test.ts).
 */
export const MARKER_Y = SHAPE_Y;

/** Anillos o trazos de una figura (cada uno es una polilínea). */
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

/**
 * Capa de un módulo. `shapeMarkers` en false deja las figuras solo con su contorno (los 3 700 lotes
 * fuera de su propio módulo, o la localidad, que no es un lugar que se pueda señalar).
 */
export function buildPlaceLayer(
  slug: string,
  emoji: string,
  collection: ModuleCollection,
  project: Projection,
  { shapeMarkers }: { shapeMarkers: boolean },
): PlaceLayer {
  const markers: number[] = [];
  const ids: number[] = [];
  const outline: number[] = [];
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
    lines.forEach((line) => pushSegments(outline, line, project));
    drawn++;
    const center = shapeMarkers ? placeCenter(geometry) : null;
    if (center) mark(properties.id, project([center.lon, center.lat]));
  }
  return { slug, emoji, markers: new Float32Array(markers), ids, outline: new Float32Array(outline), drawn };
}
