import type { ModuleItem } from '../../../lib/apiTypes';
import type { ModuleCollection } from '../../../three/places/placeLayers';
import { usePlaceScope } from '../../../three/places/placeScope';
import { useTintalData } from '../../../three/useTintalData';

export type PlaceLookup = { status: 'loading' } | { status: 'missing' } | { status: 'ready'; item: ModuleItem };

/** El primer registro con ese id en las colecciones dadas, con su geometría. */
export function findPlace(collections: readonly (ModuleCollection | null | undefined)[], id: number): ModuleItem | null {
  for (const collection of collections) {
    const feature = collection?.features.find((f) => f.properties?.id === id);
    if (feature?.properties) return { ...feature.properties, geometry: feature.geometry };
  }
  return null;
}

/**
 * Datos de un lugar elegido en la maqueta: primero en la lista abierta de su módulo (con lo último
 * guardado), si no en los 14 módulos que dibuja la maqueta. «missing» si la API ya respondió y no está.
 */
export function usePlace(slug: string, id: number): PlaceLookup {
  const api = useTintalData();
  const scopeSlug = usePlaceScope((s) => s.slug);
  const scoped = usePlaceScope((s) => s.collection);
  const all = api.status === 'ready' ? api.data.categories.find((c) => c.slug === slug)?.collection : undefined;
  const item = findPlace([scopeSlug === slug ? scoped : null, all], id);
  if (item) return { status: 'ready', item };
  return api.status === 'ready' ? { status: 'missing' } : { status: 'loading' };
}
