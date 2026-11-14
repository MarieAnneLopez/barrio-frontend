import { useApi } from '../../hooks/useApi';
import type { ModuleFeatures, ModuleItem, Page } from '../../lib/apiTypes';

export const PAGE_SIZE = 10;

/** Lista paginada (para la tabla) y colección GeoJSON (para el mapa) de un módulo. */
export function useModuleData(slug: string, page: number, q: string) {
  const list = useApi<Page<ModuleItem>>(`/${slug}`, { page, size: PAGE_SIZE, q, sort: 'nombre' });
  const features = useApi<ModuleFeatures>(`/${slug}/geojson`, { q, sort: 'nombre' });
  // 404 del endpoint del módulo = módulo aún no habilitado en la API (no es un fallo).
  const notLoaded = list.status === 'error' && list.error.status === 404;
  return { list, features, notLoaded };
}
