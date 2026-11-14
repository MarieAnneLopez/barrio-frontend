// Respuestas de la API usadas en las pruebas del módulo Centros Educativos.
import type { ModuleItem, Page } from '../lib/apiTypes';
import type { MockResponse } from './mockApi';

const point = (lon: number, lat: number) => ({ type: 'Point' as const, coordinates: [lon, lat] });

export const ITEMS: ModuleItem[] = [
  {
    id: 1, nombre: 'IED Gabriel Betancourt Mejia Sede A', tipo: 'colegio', caracter: 'publico',
    direccion: 'Carrera 87A', source_type: 'osm', source_ref: 'https://www.openstreetmap.org/way/1',
    verified: true, geometry: point(-74.155, 4.643),
  },
  {
    id: 2, nombre: 'Colegio Codema IED', tipo: 'colegio', caracter: 'publico', direccion: null,
    source_type: 'osm', source_ref: 'https://www.openstreetmap.org/way/2', verified: false,
    geometry: point(-74.157, 4.654),
  },
];

export function page(items: ModuleItem[], pageNumber = 1, pages = 1): MockResponse {
  const body: Page<ModuleItem> = { items, total: items.length, page: pageNumber, size: 10, pages };
  return { body };
}

export const FEATURES: MockResponse = {
  body: {
    type: 'FeatureCollection',
    features: ITEMS.map((item) => ({ type: 'Feature', id: item.id, geometry: item.geometry, properties: item })),
  },
};

const empty = { body: { type: 'FeatureCollection', features: [] } };

/** Mapa base mínimo: polígono con bbox y capas vacías. */
export const BASE_MAP: Record<string, MockResponse> = {
  '/barrio/poligono': {
    body: {
      type: 'Feature', bbox: [-74.177, 4.64, -74.137, 4.664],
      geometry: { type: 'MultiPolygon', coordinates: [] },
      properties: { nombre: 'El Tintal', source_ref: [], license: '© OpenStreetMap' },
    },
  },
  '/barrio/capas/manzanas': empty,
  '/barrio/capas/parques': empty,
  '/barrio/capas/vias': empty,
  '/barrio/capas/edificios': empty,
};
