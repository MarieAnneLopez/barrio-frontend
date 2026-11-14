import type { Geometry, Position } from 'geojson';

export type Bbox = [number, number, number, number];

/** Anillos de un polígono o multipolígono; otras geometrías no se dibujan. */
function rings(geometry: Geometry): Position[][] {
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
  return [];
}

/** [oeste, sur, este, norte] de una geometría poligonal. */
export function bboxOf(geometry: Geometry): Bbox {
  const points = rings(geometry).flat();
  const lons = points.map((p) => p[0] ?? 0);
  const lats = points.map((p) => p[1] ?? 0);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}

/**
 * Proyección equirectangular local (suficiente para ~10 km): x escalada por el
 * coseno de la latitud media para que la forma no se estire. Devuelve el
 * ancho y alto del lienzo para un ancho dado.
 */
export function makeProjection(bbox: Bbox, width: number) {
  const [w, s, e, n] = bbox;
  const kx = Math.cos((((s + n) / 2) * Math.PI) / 180);
  const scale = width / ((e - w) * kx);
  const height = (n - s) * scale;
  const project = ([lon = 0, lat = 0]: Position) =>
    `${((lon - w) * kx * scale).toFixed(1)},${((n - lat) * scale).toFixed(1)}`;
  return { height, project };
}

/** Atributo d de un <path> SVG con todos los anillos de la geometría. */
export function svgPath(geometry: Geometry, project: (p: Position) => string): string {
  return rings(geometry)
    .map((ring) => `M${ring.map(project).join('L')}Z`)
    .join('');
}
