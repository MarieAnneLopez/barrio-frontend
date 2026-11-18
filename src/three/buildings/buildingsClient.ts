// Hilo principal → Web Worker de los edificios. Manda una copia de las columnas que hacen falta
// (los datos de la app no se tocan) y recibe las teselas con sus buffers transferidos. Rechaza si
// el worker no arranca, contesta mal o no contesta a tiempo; entonces la escena construye en tandas.
import { isBuildReply, type BuildOptions, type BuildRequest, type BuildResult, type BuildingSource } from './protocol';

export interface WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: unknown): void;
  terminate(): void;
}

/** Si el worker no contesta en este tiempo (ms), se termina y la promesa rechaza. */
export const BUILD_TIMEOUT_MS = 30_000;

// Patrón de Vite para workers: el archivo se empaqueta como módulo aparte.
const spawnWorker = (): WorkerLike => new Worker(new URL('./buildings.worker.ts', import.meta.url), { type: 'module' });

let nextId = 1;

export interface BuildInWorkerOptions {
  options?: Partial<BuildOptions>;
  spawn?: () => WorkerLike;
  timeoutMs?: number;
  /** Al abortar (la escena se desmonta) se termina el worker y la promesa rechaza. */
  signal?: AbortSignal;
}

export function buildInWorker(source: BuildingSource, opts: BuildInWorkerOptions = {}): Promise<BuildResult> {
  const { options = {}, spawn = spawnWorker, timeoutMs = BUILD_TIMEOUT_MS, signal } = opts;
  return new Promise<BuildResult>((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('Construcción de edificios cancelada'));
    let worker: WorkerLike;
    try {
      worker = spawn();
    } catch (error: unknown) {
      return reject(error instanceof Error ? error : new Error(String(error)));
    }
    const id = nextId++;
    let done = false;
    const finish = (result: BuildResult | Error): void => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      worker.terminate();
      if (result instanceof Error) reject(result);
      else resolve(result);
    };
    const onAbort = () => finish(new Error('Construcción de edificios cancelada'));
    const timer = setTimeout(() => finish(new Error(`El worker de edificios no respondió en ${timeoutMs / 1000} s`)), timeoutMs);
    signal?.addEventListener('abort', onAbort);
    worker.onmessage = (event: MessageEvent<unknown>) => {
      const reply = event.data;
      if (!isBuildReply(reply) || reply.id !== id) finish(new Error('El worker de edificios contestó sin la forma esperada'));
      else finish(reply.ok ? reply.result : new Error(reply.error));
    };
    worker.onmessageerror = () => finish(new Error('No se pudo leer el mensaje del worker de edificios'));
    worker.onerror = (event) => finish(new Error(event.message || 'No arrancó el worker de edificios'));
    worker.postMessage({ id, source, options } satisfies BuildRequest);
  });
}
