// Campos de los 14 módulos (§11.3, espejo de los esquemas del backend): una sola
// fuente para la lista, los filtros, el detalle y el formulario.
import data from './moduleFields.json';
import type { ModuleItem } from './apiTypes';

export type FieldKind = 'text' | 'textarea' | 'tel' | 'enum' | 'number' | 'integer' | 'date' | 'boolean';

export interface FieldSpec {
  name: string;
  kind: FieldKind;
  required: boolean;
  max?: number;
  min?: number;
  pattern?: string;
  /** Valores permitidos (enum) o sugeridos para filtrar (texto). */
  options?: string[];
  /** Aparece en los filtros de la lista. */
  filter?: boolean;
  /** Fechas que representan un mes entero (robos agregados por mes). */
  format?: 'month';
}

export interface ModuleFields {
  /** Campo que nombra un registro (título de la tarjeta, ranking). */
  label: string;
  /** Orden de la lista si no es por el nombre (p. ej. "-fecha": recientes primero). */
  sort?: string;
  /** Datos clave de la tarjeta. */
  summary: string[];
  fields: FieldSpec[];
}

const MODULES = data as Record<string, ModuleFields>;

export function moduleFields(slug: string): ModuleFields {
  const spec = MODULES[slug];
  if (!spec) throw new Error(`Módulo sin campos: ${slug}`);
  return spec;
}

export const filterFields = (slug: string) => moduleFields(slug).fields.filter((f) => f.filter);

/** Nombre visible de un registro; si falta el campo, su número. */
export function labelOf(item: Pick<ModuleItem, 'id'> & Record<string, unknown>, slug: string): string {
  const value = item[moduleFields(slug).label];
  return value === null || value === undefined || value === '' ? `#${item.id}` : String(value);
}
