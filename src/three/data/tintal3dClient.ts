// API del hilo principal para los datos 3D reales (public/data/tintal): un Web Worker los baja,
// descomprime y decodifica; aquí solo se espera su respuesta. Una sola carga por sesión. Si falla
// (sin Worker o sin DecompressionStream, HTTP, formato o tiempo límite), la promesa rechaza y la
// escena sigue con la carga por la API (FORMATO.md §7).
import type { Tintal3D } from './format';

export interface WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: unknown): void;
  terminate(): void;
}

type Reply = { ok: true; data: Tintal3D } | { ok: false; error: string };

/** Si el worker no contesta en este tiempo (ms), se termina y la carga rechaza. */
export const LOAD_TIMEOUT_MS = 30_000;

function isReply(data: unknown): data is Reply {
  if (typeof data !== 'object' || data === null) return false;
  const { ok, data: value, error } = data as { ok?: unknown; data?: unknown; error?: unknown };
  return ok === true ? typeof value === 'object' && value !== null : ok === false && typeof error === 'string';
}

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

export function loadTintal3DInWorker(spawn: () => WorkerLike = spawnWorker, timeoutMs = LOAD_TIMEOUT_MS): Promise<Tintal3D> {
  cache ??= new Promise<Tintal3D>((resolve, reject) => {
    const worker = spawn();
    let done = false;
    const timer = setTimeout(() => finish(new Error(`El worker de los datos 3D no respondió en ${timeoutMs / 1000} s`)), timeoutMs);
    const finish = (result: Tintal3D | Error): void => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      worker.terminate();
      if (result instanceof Error) reject(result);
      else resolve(result);
    };
    worker.onmessage = (event: MessageEvent<unknown>) => {
      const reply = event.data;
      if (!isReply(reply)) finish(new Error('El worker de los datos 3D contestó sin la forma esperada'));
      else finish(reply.ok ? reply.data : new Error(reply.error));
    };
    worker.onmessageerror = () => finish(new Error('No se pudo leer el mensaje del worker de los datos 3D'));
    worker.onerror = (event) => finish(new Error(event.message || 'No arrancó el worker de los datos 3D'));
    worker.postMessage({ base: tintalDataBase() });
  }).catch((error: unknown) => {
    cache = null; // un fallo no queda guardado: el siguiente intento vuelve a pedir
    throw error;
  });
  return cache;
}
