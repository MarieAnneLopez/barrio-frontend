// Vista previa en SVG (mapa propio, datos © OpenStreetMap, ODbL): manzanas, parques y
// vías alrededor del lugar (~145 m al norte y al sur, ~255 m a los lados), proyectadas
// a un lienzo de 320 × 180. Funciones puras.
import type { FeatureCollection, Geometry, Position } from 'geojson';
import type { LatLon } from '../../lib/googleMapsUrls';

export const VIEW = { width: 320, height: 180 } as const;
const HALF_LAT = 0.0013; // ≈ 145 m al norte y al sur; el ancho sigue la proporción del lienzo

export interface Window {
  west: number;
  east: number;
  south: number;
  north: number;
}

export function windowAround({ lat, lon }: LatLon): Window {
  const halfLon = (HALF_LAT * VIEW.width) / VIEW.height / Math.cos((lat * Math.PI) / 180);
  return { west: lon - halfLon, east: lon + halfLon, south: lat - HALF_LAT, north: lat + HALF_LAT };
}

export function project(w: Window, [lon = 0, lat = 0]: Position): [number, number] {
  const x = ((lon - w.west) / (w.east - w.west)) * VIEW.width;
  const y = ((w.north - lat) / (w.north - w.south)) * VIEW.height;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

function rings(geometry: Geometry): Position[][] {
  switch (geometry.type) {
    case 'Polygon':
    case 'MultiLineString':
      return geometry.coordinates;
    case 'MultiPolygon':
      return geometry.coordinates.flat();
    case 'LineString':
      return [geometry.coordinates];
    default:
      return [];
  }
}

const touches = (w: Window, ring: Position[]) =>
  ring.some(([x = 0, y = 0]) => x >= w.west && x <= w.east && y >= w.south && y <= w.north);

/** Atributo d de un <path> con las líneas o anillos que tocan la ventana. */
export function pathOf(w: Window, collection: FeatureCollection, closed: boolean): string {
  const parts: string[] = [];
  for (const feature of collection.features) {
    if (!feature.geometry) continue;
    for (const ring of rings(feature.geometry)) {
      if (ring.length < 2 || !touches(w, ring)) continue;
      const points = ring.map((p) => project(w, p).join(','));
      parts.push(`M${points.join('L')}${closed ? 'Z' : ''}`);
    }
  }
  return parts.join('');
}
