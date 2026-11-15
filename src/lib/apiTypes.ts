// Contratos de la API /api/v1 que consume el frontend.
import type { FeatureCollection, Geometry, MultiPolygon } from 'geojson';

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/** Campos comunes de cualquier registro de módulo (auditoría + geometría). */
export interface ModuleItem {
  id: number;
  source_type: 'osm' | 'datos_abiertos' | 'seed';
  source_ref: string | null;
  verified: boolean;
  geometry: Geometry | null;
  nombre?: string;
  [field: string]: unknown;
}

export type ModuleFeatures = FeatureCollection<Geometry, ModuleItem>;

export interface BarrioPolygon {
  type: 'Feature';
  bbox: [number, number, number, number];
  geometry: MultiPolygon;
  properties: { nombre: string; source_ref: string[]; license: string };
}

export interface Rating {
  id: number;
  estrellas: number;
  comentario: string | null;
  autor_nombre: string | null;
  created_at: string;
}

export interface RatingSummary {
  promedio: number | null;
  total: number;
  items: Rating[];
}

/** Foto local (/assets/photos/...) con atribución. */
export interface Photo {
  id: number;
  url: string;
  alt_text: string;
  orden: number;
  autor: string | null;
  licencia: string | null;
}

export interface RankingEntry {
  categoria_slug: string;
  objeto_id: number;
  nombre: string;
  promedio: number;
  total: number;
}

/** Hito de la línea de tiempo (GET /historia); verified=false = «por verificar». */
export interface Hito {
  id: number;
  anio: number;
  orden: number;
  titulo: string;
  descripcion: string;
  source_ref: string | null;
  verified: boolean;
}

export interface Fuente {
  /** null: documento citado sin enlace (D63). */
  url: string | null;
  titulo: string;
  entidad: string;
  tipo: 'oficial' | 'prensa' | 'enciclopedia' | 'comunitaria';
  nota: string | null;
}

export interface Historia {
  consultado: string;
  hitos: Hito[];
  fuentes: Fuente[];
}
