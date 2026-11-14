// Datos del mapa base local (D5): polígono y capas OSM recortadas, servidos por la API.
// Se piden una sola vez por sesión y se comparten entre todos los mapas.
import type { FeatureCollection } from 'geojson';
import { apiGet } from '../../lib/apiClient';
import type { BarrioPolygon } from '../../lib/apiTypes';

export const BASE_LAYERS = ['manzanas', 'parques', 'vias', 'edificios'] as const;
export type BaseLayerName = (typeof BASE_LAYERS)[number];

export interface BaseMapData {
  polygon: BarrioPolygon;
  layers: Record<BaseLayerName, FeatureCollection>;
}

let cache: Promise<BaseMapData> | null = null;

async function fetchAll(): Promise<BaseMapData> {
  const [polygon, ...collections] = await Promise.all([
    apiGet<BarrioPolygon>('/barrio/poligono'),
    ...BASE_LAYERS.map((name) => apiGet<FeatureCollection>(`/barrio/capas/${name}`)),
  ]);
  const layers = Object.fromEntries(
    BASE_LAYERS.map((name, i) => [name, collections[i] as FeatureCollection]),
  ) as Record<BaseLayerName, FeatureCollection>;
  return { polygon: polygon as BarrioPolygon, layers };
}

export function loadBaseMap(): Promise<BaseMapData> {
  cache ??= fetchAll().catch((error: unknown) => {
    cache = null; // un fallo de red no queda cacheado: el siguiente intento vuelve a pedir
    throw error;
  });
  return cache;
}
