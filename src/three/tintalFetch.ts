import { apiGet } from '../lib/apiClient';
import { CATEGORIES } from '../lib/categoryConfig';
import type { ModuleCollection } from './places/placeLayers';

// Peticiones de los 14 módulos para la maqueta (D121). Las del mismo lote se inician a la vez
// (síncronas), así `quietly` las cubre.

export interface CategoryData {
  slug: string;
  emoji: string;
  /** null si la API de ese módulo falló (o si no se pidió): la leyenda lo dice y el resto se dibuja. */
  collection: ModuleCollection | null;
}

/**
 * Módulos densos (3 706 lotes, 341 tramos de calle): solo se dibujan con los 14 (Inicio y Mapa 3D).
 * Dentro de otro módulo no se piden: el de lotes pesa ~4 MB sin comprimir (511 KB con brotli),
 * tarda ~3,5 s en el servidor y un celular lo leería entero sin dibujarlo.
 */
export const DENSE_SLUGS: readonly string[] = ['datos-catastrales', 'estado-calles'];
export const isDense = (slug: string) => DENSE_SLUGS.includes(slug);

/** Pide a la vez los módulos que pasan el filtro; uno caído queda en null. */
export function fetchModules(wanted: (slug: string) => boolean): Promise<CategoryData[]> {
  return Promise.all(
    CATEGORIES.filter(({ slug }) => wanted(slug)).map(({ slug, emoji }) =>
      apiGet<ModuleCollection>(`/${slug}/geojson`).then(
        (collection) => ({ slug, emoji, collection }),
        () => ({ slug, emoji, collection: null }),
      ),
    ),
  );
}

/** Los 14 en el orden del menú: lo recién pedido y, de lo demás, lo que ya había (o null). */
export function mergeModules(previous: readonly CategoryData[], fresh: readonly CategoryData[]): CategoryData[] {
  const bySlug = new Map([...previous, ...fresh].map((c) => [c.slug, c]));
  return CATEGORIES.map(({ slug, emoji }) => bySlug.get(slug) ?? { slug, emoji, collection: null });
}
