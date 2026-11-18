// Qué módulos dibuja la maqueta según la sección (gran actualización): en el Inicio y en Mapa 3D, los
// 14 (la leyenda oculta los que el visitante quiera); dentro de un módulo, solo los suyos, con la
// búsqueda y los filtros de su lista (placeScope). Función pura.
import { findCategory } from '../../lib/categoryConfig';
import type { Projection } from '../projection';
import type { CategoryData } from '../useTintalData';
import { buildPlaceLayer, type ModuleCollection, type PlaceLayer } from './placeLayers';

export interface PlaceScope {
  /** Módulo de la sección abierta; null = los 14. */
  slug: string | null;
  /** Lugares de la lista del módulo (con su búsqueda y filtros); null mientras carga. */
  collection: ModuleCollection | null;
}

/**
 * Módulos tan densos (un marcador por lote o por tramo de calle: cientos en el barrio) que fuera de su
 * sección solo muestran su contorno o su trazo; dentro de ella sí llevan marcador para elegirlos.
 */
const DENSE = new Set(['datos-catastrales', 'estado-calles']);

/** La localidad es una ficha (FICHA), no un lugar que se pueda señalar: solo su contorno. */
const markable = (slug: string) => findCategory(slug)?.geometry !== 'FICHA';

export function sceneLayers(
  places: readonly CategoryData[] | null,
  scope: PlaceScope,
  project: Projection,
): PlaceLayer[] {
  if (scope.slug) {
    const own = scope.collection ?? places?.find((c) => c.slug === scope.slug)?.collection ?? null;
    const emoji = findCategory(scope.slug)?.emoji ?? '';
    return own ? [buildPlaceLayer(scope.slug, emoji, own, project, { shapeMarkers: markable(scope.slug) })] : [];
  }
  return (places ?? []).flatMap(({ slug, emoji, collection }) =>
    collection
      ? [buildPlaceLayer(slug, emoji, collection, project, { shapeMarkers: markable(slug) && !DENSE.has(slug) })]
      : [],
  );
}
