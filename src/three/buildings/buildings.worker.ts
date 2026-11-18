// Web Worker de los edificios: arma las mallas por teselas fuera del hilo principal y las devuelve
// transfiriendo sus buffers (sin copiarlos). Una petición, una respuesta con el mismo id.
import { buildAll } from './builder';
import { transferablesOf, type BuildReply, type BuildRequest } from './protocol';

interface Scope {
  onmessage: ((event: MessageEvent<BuildRequest>) => void) | null;
  postMessage(message: BuildReply, transfer: Transferable[]): void;
}

const scope = self as unknown as Scope;

scope.onmessage = (event) => {
  const { id, source, options } = event.data;
  try {
    const result = buildAll(source, options);
    scope.postMessage({ id, ok: true, result }, transferablesOf(result));
  } catch (error: unknown) {
    const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    scope.postMessage({ id, ok: false, error: text }, []);
  }
};
