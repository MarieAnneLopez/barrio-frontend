import { useEffect, useState } from 'react';
import { loadBaseMap, type BaseMapData } from '../components/map/baseMapData';
import { apiGet } from '../lib/apiClient';
import { CATEGORIES } from '../lib/categoryConfig';
import type { ModuleCollection } from './categoryLayers';

export interface CategoryData {
  slug: string;
  emoji: string;
  /** null si la API de ese módulo falló: la leyenda lo dice y el resto se dibuja. */
  collection: ModuleCollection | null;
}

export interface TintalData {
  base: BaseMapData;
  /** Los 14 módulos (H34, D69): antes solo se pedía Centros Educativos. */
  categories: CategoryData[];
}

type State = { status: 'loading' } | { status: 'ready'; data: TintalData } | { status: 'error' };

/** Mapa base + lugares de los 14 módulos en paralelo; si un módulo falla, la maqueta igual se muestra. */
export function useTintalData(attempt: number): State {
  const [state, setState] = useState<{ attempt: number; value: State }>({
    attempt: -1,
    value: { status: 'loading' },
  });

  useEffect(() => {
    let cancelled = false;
    const categories = Promise.all(
      CATEGORIES.map(({ slug, emoji }) =>
        apiGet<ModuleCollection>(`/${slug}/geojson`).then(
          (collection) => ({ slug, emoji, collection }),
          () => ({ slug, emoji, collection: null }),
        ),
      ),
    );
    Promise.all([loadBaseMap(), categories]).then(
      ([base, data]) => {
        if (!cancelled) setState({ attempt, value: { status: 'ready', data: { base, categories: data } } });
      },
      () => {
        if (!cancelled) setState({ attempt, value: { status: 'error' } });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return state.attempt === attempt ? state.value : { status: 'loading' };
}
