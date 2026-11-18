import { quietly } from '../lib/loadingTracker';
import { type CategoryData, fetchModules, isDense, mergeModules } from './tintalFetch';

export interface TintalData {
  /** Los 14 módulos (H34, D69). La maqueta ya no pide el mapa base a la API: viene de TNT3 (D105). */
  categories: CategoryData[];
}

export type TintalState = { status: 'loading' } | { status: 'ready'; data: TintalData };

/** Espera entre reintentos (ms): la API gratuita tarda ~45 s en despertar (D64). */
export const RETRY_MS = [1000, 2000, 4000, 8000, 15000];

// Estado compartido por toda la app (D83): los datos se piden una sola vez y sobreviven al cambio
// de sección, así ni la escena ni sus fuentes se vuelven a crear. Los módulos densos (D121) solo se
// piden cuando alguien muestra los 14 (`allWanted`); `allLoaded` dice si ya vinieron en algún lote.
let state: TintalState = { status: 'loading' };
let started = false;
let generation = 0;
let timer: number | undefined;
let allWanted = false;
let allLoaded = false;
let denseLoading = false;
const listeners = new Set<() => void>();

function publish(fresh: CategoryData[]): void {
  const previous = state.status === 'ready' ? state.data.categories : [];
  state = { status: 'ready', data: { categories: mergeModules(previous, fresh) } };
  listeners.forEach((listener) => listener());
}

/** Los densos solos, cuando ya hay datos sin ellos (de un módulo se pasa a Mapa 3D o al Inicio). */
function fetchDense(gen: number): void {
  if (allLoaded || denseLoading || state.status !== 'ready') return;
  denseLoading = true;
  void quietly(() => fetchModules(isDense)).then((fresh) => {
    if (gen !== generation) return;
    denseLoading = false;
    allLoaded = true;
    publish(fresh);
  });
}

function run(tries: number, gen: number): void {
  // Sin la pantalla de carga completa, también al primer intento (D112): la maqueta tiene sus propios
  // indicadores y en el Inicio se pide a mitad de página, al acercarse al capítulo 3.
  const all = allWanted;
  void quietly(() => fetchModules((slug) => all || !isDense(slug))).then((fresh) => {
    if (gen !== generation) return;
    // Si todos fallan, la API sigue dormida: se reintenta (un módulo suelto caído se dibuja sin él).
    if (fresh.every((c) => c.collection === null)) {
      timer = window.setTimeout(() => run(tries + 1, gen), RETRY_MS[Math.min(tries, RETRY_MS.length - 1)]);
      return;
    }
    if (all) allLoaded = true;
    publish(fresh);
    if (allWanted) fetchDense(gen);
  });
}

/** Arranca la primera petición (una sola vez); con `all`, también los densos (ahora o con ella). */
export function startTintalData(all: boolean): void {
  if (all) {
    allWanted = true;
    fetchDense(generation);
  }
  if (started) return;
  started = true;
  run(0, generation);
}

/** Para las pruebas: olvida los datos y corta los reintentos en curso. */
export function resetTintalData(): void {
  generation += 1;
  started = allWanted = allLoaded = denseLoading = false;
  window.clearTimeout(timer);
  state = { status: 'loading' };
}

/**
 * Tras crear, editar o borrar un lugar: vuelve a pedir los módulos en silencio (los densos, si no se
 * muestran los 14, cuando vuelvan a hacer falta). Mientras tanto la maqueta sigue con lo que tiene
 * (sin pantalla de carga); así no se queda con un lugar borrado o viejo.
 */
export function refreshTintalData(): void {
  if (!started) return;
  generation += 1;
  denseLoading = false;
  if (!allWanted) allLoaded = false;
  window.clearTimeout(timer);
  run(1, generation);
}

export function subscribeTintalData(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const tintalSnapshot = () => state;
