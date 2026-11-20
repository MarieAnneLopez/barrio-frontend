import { useApi } from '../../hooks/useApi';
import type { ModuleFeatures, ModuleItem, Page } from '../../lib/apiTypes';
import { moduleFields } from '../../lib/moduleFields';
import { refreshTintalData } from '../../three/useTintalData';

export const PAGE_SIZE = 10;

export type Filters = Record<string, string>;

/**
 * Lista paginada (para la tabla) y colección GeoJSON (para el mapa) de un módulo. `refresh`, tras
 * crear, editar o borrar, vuelve a pedir las dos y también los lugares que dibuja la maqueta.
 */
export function useModuleData(slug: string, page: number, q: string, filters: Filters = {}, includeDrafts = false) {
  const { label, sort: preferred } = moduleFields(slug);
  const sort = preferred ?? label;
  const list = useApi<Page<ModuleItem>>(`/${slug}${includeDrafts ? '/admin' : ''}`, { page, size: PAGE_SIZE, q, sort, ...filters });
  const features = useApi<ModuleFeatures>(`/${slug}/geojson`, { q, sort, ...filters });
  // 404 del endpoint del módulo = módulo aún no habilitado en la API (no es un fallo).
  const notLoaded = list.status === 'error' && list.error.status === 404;
  const refresh = () => {
    list.retry();
    features.retry();
    refreshTintalData();
  };
  return { list, features, notLoaded, refresh };
}
