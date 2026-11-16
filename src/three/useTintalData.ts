import { useEffect, useState } from 'react';
import { loadBaseMap, type BaseMapData } from '../components/map/baseMapData';
import { apiGet } from '../lib/apiClient';
import { quietly } from '../lib/loadingTracker';
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

type State = { status: 'loading' } | { status: 'ready'; data: TintalData };

/** Espera entre reintentos (ms): la API gratuita tarda ~45 s en despertar (D64). */
export const RETRY_MS = [1000, 2000, 4000, 8000, 15000];
/** Todas las peticiones se inician a la vez (síncronas), así `quietly` las cubre. */
async function fetchAll(): Promise<TintalData> {
  const categories = Promise.all(
    CATEGORIES.map(({ slug, emoji }) =>
      apiGet<ModuleCollection>(`/${slug}/geojson`).then(
        (collection) => ({ slug, emoji, collection }),
        () => ({ slug, emoji, collection: null }),
      ),
    ),
  );
  const [base, data] = await Promise.all([loadBaseMap(), categories]); // si el mapa base falla, se reintenta
  return { base, categories: data };
}

/**
 * Mapa base + lugares de los 14 módulos. Nunca se rinde (pedido de Marie: el mensaje de
 * error de la maqueta no debe aparecer): mientras la API no responde se sigue en «cargando»
 * y se reintenta solo, con esperas crecientes y sin volver a tapar la página: solo la primera
 * carga muestra la pantalla completa; los reintentos van en silencio (la maqueta sigue en esqueleto).
 */
export function useTintalData(): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const run = (tries: number) => {
      (tries === 0 ? fetchAll() : quietly(fetchAll)).then(
        (data) => !cancelled && setState({ status: 'ready', data }),
        () => {
          if (cancelled) return;
          timer = window.setTimeout(() => run(tries + 1), RETRY_MS[Math.min(tries, RETRY_MS.length - 1)]);
        },
      );
    };
    run(0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return state;
}
