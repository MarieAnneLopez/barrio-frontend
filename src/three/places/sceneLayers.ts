// Qué módulos dibuja la maqueta según la sección (gran actualización): en el Inicio y en Mapa 3D, los
// 14 (la leyenda oculta los que el visitante quiera); dentro de un módulo, solo los suyos, con la
// búsqueda y los filtros de su lista (placeScope). Función pura.
import { findCategory, onTheModel } from '../../lib/categoryConfig';
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
 * Módulos tan densos (3 706 lotes, 341 tramos de calle) que un marcador por figura es una alfombra
 * que tapa el mapa: fuera de su sección solo muestran su contorno o su trazo; dentro de ella, cada
 * figura se elige en el suelo (placeShapes) y solo la elegida lleva marcador.
 */
const DENSE = new Set(['datos-catastrales', 'estado-calles']);

const NOTHING: ModuleCollection = { type: 'FeatureCollection', features: [] };

/**
 * La localidad (FICHA) no se dibuja (onTheModel): su capa queda vacía, sin contorno ni marcador, y
 * la leyenda lo dice. Su contorno de Kennedy salía de la isla y flotaba sobre el cielo.
 */
const drawable = (slug: string, collection: ModuleCollection) => (onTheModel(slug) ? collection : NOTHING);

export function sceneLayers(
  places: readonly CategoryData[] | null,
  scope: PlaceScope,
  project: Projection,
): PlaceLayer[] {
  if (scope.slug) {
    const own = scope.collection ?? places?.find((c) => c.slug === scope.slug)?.collection ?? null;
    const emoji = findCategory(scope.slug)?.emoji ?? '';
    const dense = DENSE.has(scope.slug);
    const rule = { shapeMarkers: !dense, pickShapes: dense };
    return own ? [buildPlaceLayer(scope.slug, emoji, drawable(scope.slug, own), project, rule)] : [];
  }
  return (places ?? []).flatMap(({ slug, emoji, collection }) =>
    collection
      ? [buildPlaceLayer(slug, emoji, drawable(slug, collection), project, { shapeMarkers: !DENSE.has(slug) })]
      : [],
  );
}
