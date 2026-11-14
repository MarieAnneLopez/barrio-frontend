import { useApi } from '../../hooks/useApi';
import type { ModuleFeatures, ModuleItem, Page } from '../../lib/apiTypes';
import { moduleFields } from '../../lib/moduleFields';

export const PAGE_SIZE = 10;

export type Filters = Record<string, string>;

/** Lista paginada (para la tabla) y colección GeoJSON (para el mapa) de un módulo. */
export function useModuleData(slug: string, page: number, q: string, filters: Filters = {}) {
  const sort = moduleFields(slug).label;
  const list = useApi<Page<ModuleItem>>(`/${slug}`, { page, size: PAGE_SIZE, q, sort, ...filters });
  const features = useApi<ModuleFeatures>(`/${slug}/geojson`, { q, sort, ...filters });
  // 404 del endpoint del módulo = módulo aún no habilitado en la API (no es un fallo).
  const notLoaded = list.status === 'error' && list.error.status === 404;
  return { list, features, notLoaded };
}
