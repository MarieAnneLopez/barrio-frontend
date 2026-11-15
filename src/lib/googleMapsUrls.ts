// Enlaces oficiales de Google Maps (Maps URLs): no necesitan clave y no copian nada de
// Google; solo abren su sitio en las coordenadas del lugar.
// Fuente: https://developers.google.com/maps/documentation/urls/get-started
// («You don't need a Google API key to use Maps URLs»; acciones search y map_action=pano).
import type { Geometry } from 'geojson';
import { geometryBounds } from '../components/map/geometryBounds';

export interface LatLon {
  lat: number;
  lon: number;
}

/** Centro del rectángulo que contiene la geometría (punto, tramo de calle o parque). */
export function placeCenter(geometry: Geometry | null): LatLon | null {
  const bounds = geometry ? geometryBounds(geometry) : null;
  if (!bounds) return null;
  const [[west, south], [east, north]] = bounds;
  return { lat: (south + north) / 2, lon: (west + east) / 2 };
}

const coords = ({ lat, lon }: LatLon) => encodeURIComponent(`${lat.toFixed(6)},${lon.toFixed(6)}`);

/** Acción «search»: Google Maps centrado en el lugar. */
export function mapsSearchUrl(at: LatLon): string {
  return `https://www.google.com/maps/search/?api=1&query=${coords(at)}`;
}

/** Acción «map_action=pano»: Street View en el punto más cercano que tenga panorama. */
export function streetViewUrl(at: LatLon): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coords(at)}`;
}
