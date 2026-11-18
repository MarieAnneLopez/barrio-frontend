// Web Worker de los datos 3D: descarga, descomprime y decodifica fuera del hilo principal y
// devuelve los arreglos transfiriendo sus buffers (sin copiarlos).
import { loadTintal3D, transferables } from './loadTintal3D';

interface Scope {
  onmessage: ((event: MessageEvent<{ base: string }>) => void) | null;
  postMessage(message: unknown, transfer: Transferable[]): void;
}

const scope = self as unknown as Scope;

scope.onmessage = (event) => {
  loadTintal3D(event.data.base).then(
    (data) => scope.postMessage({ ok: true, data }, transferables(data)),
    (error: unknown) => {
      const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      scope.postMessage({ ok: false, error: text }, []);
    },
  );
};
