// API del hilo principal para los datos 3D reales (public/data/tintal): un Web Worker los baja,
// descomprime y decodifica; aquí solo se espera su respuesta. Una sola carga por sesión.
import type { Tintal3D } from './format';

export interface WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: unknown): void;
  terminate(): void;
}

type Reply = { ok: true; data: Tintal3D } | { ok: false; error: string };

/** Carpeta de los datos en el mismo origen (respeta el `base` de Vite). */
export function tintalDataBase(): string {
  return new URL(`${import.meta.env.BASE_URL}data/tintal/`, window.location.href).href;
}

// Patrón de Vite para workers: el archivo se empaqueta como módulo aparte.
const spawnWorker = (): WorkerLike => new Worker(new URL('./tintal3d.worker.ts', import.meta.url), { type: 'module' });

let cache: Promise<Tintal3D> | null = null;

/** Para las pruebas: olvida la carga hecha. */
export function clearTintal3DCache(): void {
  cache = null;
}

export function loadTintal3DInWorker(spawn: () => WorkerLike = spawnWorker): Promise<Tintal3D> {
  cache ??= new Promise<Tintal3D>((resolve, reject) => {
    const worker = spawn();
    worker.onmessage = (event: MessageEvent<Reply>) => {
      worker.terminate();
      if (event.data.ok) resolve(event.data.data);
      else reject(new Error(event.data.error));
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message || 'No arrancó el worker de los datos 3D'));
    };
    worker.postMessage({ base: tintalDataBase() });
  }).catch((error: unknown) => {
    cache = null; // un fallo no queda guardado: el siguiente intento vuelve a pedir
    throw error;
  });
  return cache;
}
