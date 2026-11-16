import { useEffect, useSyncExternalStore } from 'react';
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

// Estado compartido por toda la app (D83): los datos se piden una sola vez y sobreviven al
// cambio de sección, así ni la escena ni sus fuentes se vuelven a crear.
let state: State = { status: 'loading' };
let started = false;
let generation = 0;
let timer: number | undefined;
const listeners = new Set<() => void>();

function run(tries: number, gen: number): void {
  (tries === 0 ? fetchAll() : quietly(fetchAll)).then(
    (data) => {
      if (gen !== generation) return;
      state = { status: 'ready', data };
      listeners.forEach((listener) => listener());
    },
    () => {
      if (gen !== generation) return;
      timer = window.setTimeout(() => run(tries + 1, gen), RETRY_MS[Math.min(tries, RETRY_MS.length - 1)]);
    },
  );
}

/** Para las pruebas: olvida los datos y corta los reintentos en curso. */
export function resetTintalData(): void {
  generation += 1;
  started = false;
  window.clearTimeout(timer);
  state = { status: 'loading' };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Mapa base + lugares de los 14 módulos. Nunca se rinde (pedido de Marie: el mensaje de error de
 * la maqueta no debe aparecer): mientras la API no responde se sigue en «cargando» y se reintenta
 * solo, con esperas crecientes y en silencio (solo la primera carga muestra la pantalla completa).
 */
export function useTintalData(): State {
  useEffect(() => {
    if (started) return;
    started = true;
    run(0, generation);
  }, []);
  return useSyncExternalStore(subscribe, () => state);
}
