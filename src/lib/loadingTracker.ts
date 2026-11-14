import { useLoadingStore } from '../store/loadingStore';

/**
 * Etapas reales de una petición para la LoadingRunnerBar (H24): enviada (10 %),
 * cabeceras recibidas (35 %) y cuerpo leído por partes según Content-Length
 * (35–100 %). Sin Content-Length el cuerpo se lee de una vez.
 */
export const STAGE = { sent: 0.1, headers: 0.35 } as const;

/** Rutas que no mueven la barra: tienen su propio indicador o son casi instantáneas. */
const QUIET = ['/auth/session', '/chat'];

export interface Tracker {
  stage: (value: number) => void;
  done: () => void;
}

const SILENT: Tracker = { stage: () => undefined, done: () => undefined };

export function track(path: string): Tracker {
  if (QUIET.some((quiet) => path.startsWith(quiet))) return SILENT;
  const { begin, update, end } = useLoadingStore.getState();
  const id = begin();
  update(id, STAGE.sent);
  return { stage: (value) => update(id, value), done: () => end(id) };
}

/** Lee el JSON informando el avance de los bytes recibidos. */
export async function readJson<T>(response: Response, tracker: Tracker): Promise<T> {
  tracker.stage(STAGE.headers);
  const total = Number(response.headers.get('Content-Length') ?? 0);
  if (!response.body || !total) return (await response.json()) as T;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    tracker.stage(STAGE.headers + (1 - STAGE.headers) * Math.min(1, received / total));
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}
