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
