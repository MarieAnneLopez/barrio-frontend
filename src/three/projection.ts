// Proyección local equirectangular: lon/lat (WGS84) → metros en el plano x/z de three.
// Para ~5 km en la latitud de Bogotá el error es despreciable para una maqueta.
export type Projection = (lonLat: readonly number[]) => [number, number];

const METERS_PER_DEG_LAT = 110_574;
const METERS_PER_DEG_LON_EQUATOR = 111_320;

/** Origen en el centro del bbox; x hacia el este, z hacia el sur (el norte es -z). */
export function createProjection(bbox: readonly [number, number, number, number]): Projection {
  const [west, south, east, north] = bbox;
  const lon0 = (west + east) / 2;
  const lat0 = (south + north) / 2;
  const kx = METERS_PER_DEG_LON_EQUATOR * Math.cos((lat0 * Math.PI) / 180);
  return ([lon = 0, lat = 0]) => [(lon - lon0) * kx, -(lat - lat0) * METERS_PER_DEG_LAT];
}

/** Tamaño del bbox en metros (ancho este-oeste, alto norte-sur). */
export function bboxSize(bbox: readonly [number, number, number, number]): [number, number] {
  const project = createProjection(bbox);
  const [x0, z0] = project([bbox[0], bbox[1]]);
  const [x1, z1] = project([bbox[2], bbox[3]]);
  return [Math.abs(x1 - x0), Math.abs(z1 - z0)];
}
