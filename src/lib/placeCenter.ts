// Centro de la geometría de un lugar (punto, tramo de calle, parque o lote), en longitud y latitud:
// la maqueta pone ahí su marcador y la cámara vuela ahí al elegirlo en la lista. Funciones puras.
import type { Geometry, Position } from 'geojson';

export interface LatLon {
  lat: number;
  lon: number;
}

export type Bounds = [[number, number], [number, number]];

function positions(geometry: Geometry): Position[] {
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates];
    case 'LineString':
    case 'MultiPoint':
      return geometry.coordinates;
    case 'Polygon':
    case 'MultiLineString':
      return geometry.coordinates.flat();
    case 'MultiPolygon':
      return geometry.coordinates.flat(2);
    default:
      return geometry.geometries.flatMap(positions);
  }
}

/** Rectángulo [[oeste, sur], [este, norte]] que contiene la geometría; null si no tiene vértices. */
export function geometryBounds(geometry: Geometry): Bounds | null {
  const all = positions(geometry);
  if (!all.length) return null;
  const xs = all.map((p) => p[0] ?? 0);
  const ys = all.map((p) => p[1] ?? 0);
  return [
    [Math.min(...xs), Math.min(...ys)],
    [Math.max(...xs), Math.max(...ys)],
  ];
}

/** Centro del rectángulo que contiene la geometría (punto, tramo de calle o parque). */
export function placeCenter(geometry: Geometry | null): LatLon | null {
  const bounds = geometry ? geometryBounds(geometry) : null;
  if (!bounds) return null;
  const [[west, south], [east, north]] = bounds;
  return { lat: (south + north) / 2, lon: (west + east) / 2 };
}
