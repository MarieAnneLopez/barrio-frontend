import { useEffect, useSyncExternalStore } from 'react';
import type { Tintal3D } from './format';
import { loadTintal3D } from './loadTintal3D';
import { loadTintal3DInWorker, tintalDataBase } from './tintal3dClient';

// Datos reales de la maqueta (D105, formato TNT3): estáticos, del mismo sitio; no dependen de que la
// API esté despierta. Se bajan una sola vez por sesión en un Web Worker; si el worker no arranca
// (navegador sin módulos en workers), se decodifican en el hilo principal. Nunca se rinde: reintenta.

export type Tintal3DState = { status: 'loading' } | { status: 'ready'; data: Tintal3D };

/** Esperas entre reintentos (ms). */
export const RETRY_3D_MS = [500, 2000, 5000, 10_000];

export interface Loaders {
  worker: () => Promise<Tintal3D>;
  main: () => Promise<Tintal3D>;
}

const defaults: Loaders = { worker: () => loadTintal3DInWorker(), main: () => loadTintal3D(tintalDataBase()) };

let state: Tintal3DState = { status: 'loading' };
let started = false;
let generation = 0;
let timer: number | undefined;
let loaders = defaults;
const listeners = new Set<() => void>();

function run(tries: number, gen: number): void {
  // Pares: worker; impares: hilo principal. Así un worker roto no deja la maqueta sin datos.
  (tries % 2 === 0 ? loaders.worker() : loaders.main()).then(
    (data) => {
      if (gen !== generation) return;
      state = { status: 'ready', data };
      listeners.forEach((listener) => listener());
    },
    () => {
      if (gen !== generation) return;
      timer = window.setTimeout(() => run(tries + 1, gen), RETRY_3D_MS[Math.min(tries, RETRY_3D_MS.length - 1)]);
    },
  );
}

/** Para las pruebas: olvida los datos, corta los reintentos y permite cambiar los cargadores. */
export function resetTintal3D(next: Loaders = defaults): void {
  generation += 1;
  started = false;
  window.clearTimeout(timer);
  state = { status: 'loading' };
  loaders = next;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Los datos 3D compartidos por toda la app (D83): la escena no se vuelve a crear al cambiar de sección. */
export function useTintal3D(): Tintal3DState {
  useEffect(() => {
    if (started) return;
    started = true;
    run(0, generation);
  }, []);
  return useSyncExternalStore(subscribe, () => state);
}
