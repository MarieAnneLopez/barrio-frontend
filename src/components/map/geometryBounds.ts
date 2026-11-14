import type { Geometry, Position } from 'geojson';

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

/** Rectángulo [[oeste, sur], [este, norte]] que contiene la geometría. */
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
