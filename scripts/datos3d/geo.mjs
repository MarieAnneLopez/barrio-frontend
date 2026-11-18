// Geometría plana del script de datos 3D. Los puntos son [x, z] en metros, con la misma
// proyección local que la escena (src/three/projection.ts; una prueba vigila que coincidan):
// x hacia el este, z hacia el sur. «Antihorario» se entiende mirando desde arriba, norte arriba.
const METERS_PER_DEG_LAT = 110_574;
const METERS_PER_DEG_LON_EQUATOR = 111_320;

export function projectionInfo([west, south, east, north]) {
  const lon0 = (west + east) / 2;
  const lat0 = (south + north) / 2;
  const kx = METERS_PER_DEG_LON_EQUATOR * Math.cos((lat0 * Math.PI) / 180);
  return { origen: [lon0, lat0], metrosPorGradoLon: kx, metrosPorGradoLat: METERS_PER_DEG_LAT };
}

/** lon/lat (WGS84) → [x, z] en metros; copia exacta de createProjection de la escena. */
export function createProjection(bbox) {
  const { origen: [lon0, lat0], metrosPorGradoLon: kx } = projectionInfo(bbox);
  return ([lon = 0, lat = 0]) => [(lon - lon0) * kx, -(lat - lat0) * METERS_PER_DEG_LAT];
}

/** Área con signo (m²): positiva si el anillo gira antihorario visto desde arriba. */
export function signedArea(ring) {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += ring[j][0] * -ring[i][1] - ring[i][0] * -ring[j][1];
  }
  return sum / 2;
}

/** Centroide de área del anillo (o el promedio de vértices si el área es nula). */
export function centroid(ring) {
  let cx = 0;
  let cz = 0;
  let twice = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    twice += cross;
    cx += (ring[j][0] + ring[i][0]) * cross;
    cz += (ring[j][1] + ring[i][1]) * cross;
  }
  if (Math.abs(twice) < 1e-9) {
    const n = ring.length || 1;
    return [ring.reduce((t, p) => t + p[0], 0) / n, ring.reduce((t, p) => t + p[1], 0) / n];
  }
  return [cx / (3 * twice), cz / (3 * twice)];
}

/** [minX, minZ, maxX, maxZ] de una lista de puntos. */
export function bounds(points) {
  let b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, z] of points) b = [Math.min(b[0], x), Math.min(b[1], z), Math.max(b[2], x), Math.max(b[3], z)];
  return b;
}
