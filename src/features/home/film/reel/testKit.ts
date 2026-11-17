// Utilidades de las pruebas del reel: jsdom no trae un requestAnimationFrame que se pueda manejar
// a mano, ni IntersectionObserver, ni ResizeObserver. Los globales que se sustituyen aquí los
// restaura src/test/setup.ts después de cada prueba (vi.unstubAllGlobals).
import { vi } from 'vitest';

/** Cola de requestAnimationFrame que la prueba hace avanzar cuando quiere. */
export function fakeFrames() {
  const pending = new Map<number, FrameRequestCallback>();
  let nextId = 0;
  let clock = 1000;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    nextId += 1;
    pending.set(nextId, callback);
    return nextId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => pending.delete(id));
  /** Corre los cuadros pedidos como haría el navegador, con la hora `now` (ms). */
  const flush = (now: number) => {
    clock = now;
    const callbacks = [...pending.values()];
    pending.clear();
    callbacks.forEach((callback) => callback(now));
  };
  return {
    pending,
    flush,
    /** Corre `count` cuadros seguidos, a 16 ms cada uno. */
    run(count: number) {
      for (let frame = 0; frame < count; frame += 1) flush(clock + 16);
    },
  };
}

/** Simula que la pestaña se oculta o vuelve a verse. `restoreHidden` lo deshace. */
export function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}
export const restoreHidden = () => Reflect.deleteProperty(document, 'hidden');

interface Watcher {
  callback: (entries: { isIntersecting: boolean }[]) => void;
  options: unknown;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

/** IntersectionObserver y ResizeObserver de mentira; devuelve los creados para dispararlos a mano. */
export function fakeObservers() {
  const created: { intersection: Watcher[]; resize: Watcher[] } = { intersection: [], resize: [] };
  const make = (list: Watcher[]) =>
    class {
      observe = vi.fn();
      disconnect = vi.fn();
      callback: Watcher['callback'];
      options: unknown;
      constructor(callback: Watcher['callback'], options?: unknown) {
        this.callback = callback;
        this.options = options;
        list.push(this);
      }
    };
  vi.stubGlobal('IntersectionObserver', make(created.intersection));
  vi.stubGlobal('ResizeObserver', make(created.resize));
  return {
    created,
    /** El capítulo entra en pantalla o sale de ella. */
    show(visible: boolean) {
      created.intersection.forEach((watcher) => watcher.callback([{ isIntersecting: visible }]));
    },
  };
}
