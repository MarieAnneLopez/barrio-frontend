import type { FeatureCollection, Point } from 'geojson';
import { useEffect, useState } from 'react';
import { loadBaseMap, type BaseMapData } from '../components/map/baseMapData';
import { apiGet } from '../lib/apiClient';
import type { ModuleItem } from '../lib/apiTypes';

export interface TintalData {
  base: BaseMapData;
  /** Lugares para los billboards (por ahora el módulo con datos: Centros Educativos). */
  places: FeatureCollection<Point, ModuleItem>;
}

type State = { status: 'loading' } | { status: 'ready'; data: TintalData } | { status: 'error' };

const EMPTY: FeatureCollection<Point, ModuleItem> = { type: 'FeatureCollection', features: [] };

/** Mapa base + lugares; si los lugares fallan, la maqueta igual se muestra. */
export function useTintalData(attempt: number): State {
  const [state, setState] = useState<{ attempt: number; value: State }>({
    attempt: -1,
    value: { status: 'loading' },
  });

  useEffect(() => {
    let cancelled = false;
    const places = apiGet<FeatureCollection<Point, ModuleItem>>('/centros-educativos/geojson').catch(() => EMPTY);
    Promise.all([loadBaseMap(), places]).then(
      ([base, placesData]) => {
        if (!cancelled) setState({ attempt, value: { status: 'ready', data: { base, places: placesData } } });
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
