// Barbería con fotos y calificaciones para las pruebas de la ficha (H19).
import type { ModuleItem, Photo, RatingSummary } from '../lib/apiTypes';
import type { MockResponse } from './mockApi';
import { BASE_MAP, page } from './moduleFixtures';
import type { Usuario } from '../features/auth/authApi';
import { sessionAs, VISITANTE } from './authFixtures';

export const BARBERIA: ModuleItem = {
  id: 3, nombre: 'Barbería Kings', servicios: 'Corte, barba', direccion: null, horario: null,
  source_type: 'osm', source_ref: 'https://www.openstreetmap.org/node/3', verified: true,
  geometry: { type: 'Point', coordinates: [-74.155, 4.643] },
};

export const PHOTOS: Photo[] = [
  { id: 1, url: '/assets/photos/kings-1.webp', alt_text: 'Fachada de la barbería', orden: 0, autor: 'Ana', licencia: 'CC BY 4.0' },
  { id: 2, url: '/assets/photos/kings-2.webp', alt_text: 'Sillas del local', orden: 1, autor: null, licencia: 'CC BY-SA 4.0' },
];

export const SUMMARY: RatingSummary = {
  promedio: 4.25, total: 2,
  items: [{ id: 9, estrellas: 4.5, comentario: 'Muy buen corte', autor_nombre: null, created_at: '2026-11-14T10:00:00Z' }],
};

const features = { body: { type: 'FeatureCollection', features: [] } };

/** Rutas de la barbería; `ratings` decide qué responde el POST de calificaciones. */
export function barberiaRoutes(ratings: (init?: RequestInit) => MockResponse, photos: Photo[] = PHOTOS,
  user: Usuario | null = VISITANTE) {
  return {
    ...BASE_MAP,
    ...sessionAs(user),
    '/barberias': page([BARBERIA]),
    '/barberias/geojson': features,
    '/barberias/3': { body: BARBERIA },
    '/barberias/3/fotos': { body: photos },
    '/barberias/3/calificaciones': (_url: URL, init?: RequestInit) =>
      init?.method === 'POST' ? ratings(init) : { body: SUMMARY },
  };
}
