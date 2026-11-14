// Métricas de los edificios para la telemetría del hover (datos reales de OSM).
import type { Feature, Geometry } from 'geojson';
import type { Projection } from './projection';

export const METERS_PER_LEVEL = 3.2;
const DEFAULT_LEVELS = 3;

/** Pisos según OSM (building:levels, o height / 3,2 m); 3 si OSM no lo indica. */
export function levelsOf(feature: Pick<Feature, 'properties'>): number {
  const props = (feature.properties ?? {}) as { levels?: string | null; height?: string | null };
  const levels = Number.parseFloat(props.levels ?? '');
  if (Number.isFinite(levels) && levels > 0) return levels;
  const height = Number.parseFloat(props.height ?? '');
  if (Number.isFinite(height) && height > 0) return Math.max(1, Math.round(height / METERS_PER_LEVEL));
  return DEFAULT_LEVELS;
}

/** Área en m² del anillo exterior (fórmula del área de Gauss sobre la proyección local). */
export function footprintArea(feature: { geometry: Geometry | null }, project: Projection): number {
  const geometry = feature.geometry;
  if (!geometry || (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')) return 0;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let total = 0;
  for (const [outer = []] of polygons) {
    const points = outer.map((p) => project(p));
    let sum = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const [x1, z1] = points[i] ?? [0, 0];
      const [x2, z2] = points[i + 1] ?? [0, 0];
      sum += x1 * z2 - x2 * z1;
    }
    total += Math.abs(sum) / 2;
  }
  return total;
}
