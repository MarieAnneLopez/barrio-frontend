// El polígono de El Tintal (D38/D62: UPZ 78 + UPZ 79) proyectado: qué cae dentro y recorte de líneas.
import { clipLine } from './clip.mjs';
import { pointInPolygon } from './inside.mjs';
import { geojsonPolygons } from './osm.mjs';

export function loadBarrio(feature, project) {
  if (feature?.geometry?.type !== 'MultiPolygon' && feature?.geometry?.type !== 'Polygon') {
    throw new Error('El polígono de El Tintal no es un Polygon/MultiPolygon GeoJSON');
  }
  if (!Array.isArray(feature.bbox) || feature.bbox.length !== 4) throw new Error('El polígono no trae bbox');
  const open = (ring) => (ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? ring.slice(0, -1) : ring);
  const polygons = geojsonPolygons(feature.geometry, project).map((rings) => rings.map(open));
  return {
    feature,
    bbox: feature.bbox,
    polygons,
    inside: (point) => polygons.some((rings) => pointInPolygon(point, rings)),
    clip: (points) => polygons.flatMap((rings) => clipLine(points, rings)),
  };
}
