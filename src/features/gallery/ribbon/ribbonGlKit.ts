// Dobles para las pruebas de la cinta: el renderer de three (jsdom no tiene WebGL), un
// requestAnimationFrame que la prueba hace avanzar a mano, y los observadores que jsdom no trae.
// Los globales sustituidos los restaura src/test/setup.ts después de cada prueba (vi.unstubAllGlobals).
import { vi } from 'vitest';

/** Renderers creados en la prueba. */
export const renderers: FakeRenderer[] = [];

export class FakeRenderer {
  domElement: HTMLCanvasElement;
  capabilities = { getMaxAnisotropy: () => 8 };
  setPixelRatio = vi.fn();
  setSize = vi.fn();
  render = vi.fn();
  dispose = vi.fn();
  forceContextLoss = vi.fn();
  parameters: Record<string, unknown>;

  constructor(parameters: { canvas?: HTMLCanvasElement } = {}) {
    this.parameters = parameters;
    this.domElement = parameters.canvas ?? document.createElement('canvas');
    renderers.push(this);
  }
}

/** `three` de verdad con el renderer de mentira: vi.mock('three', async (o) => (await import('./ribbonGlKit')).fakeThree(o)). */
export async function fakeThree(original: () => Promise<unknown>) {
  return { ...((await original()) as object), WebGLRenderer: FakeRenderer };
}

/** Un navegador con WebGL 2 y un lienzo de 1440 × 836 px. */
export function fakeWebGL(width = 1440, height = 836): void {
  renderers.length = 0;
  vi.stubGlobal('WebGL2RenderingContext', Object);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(height);
  Object.assign(HTMLElement.prototype, { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn(), hasPointerCapture: () => false });
}

/** Cola de requestAnimationFrame que la prueba hace avanzar cuando quiere (16 ms por cuadro). */
export function fakeFrames() {
  const pending = new Map<number, FrameRequestCallback>();
  let [nextId, clock] = [0, 1000];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    nextId += 1;
    pending.set(nextId, callback);
    return nextId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => pending.delete(id));
  const flush = (now: number) => {
    clock = now;
    const callbacks = [...pending.values()];
    pending.clear();
    callbacks.forEach((callback) => callback(now));
  };
  return { pending, flush, run: (count: number) => Array.from({ length: count }, () => flush(clock + 16)) };
}

interface Watcher {
  callback: (entries: { isIntersecting: boolean }[]) => void;
  options?: unknown;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

/** IntersectionObserver y ResizeObserver de mentira; `show` dispara los primeros a mano. */
export function fakeObservers() {
  const created: { intersection: Watcher[]; resize: Watcher[] } = { intersection: [], resize: [] };
  const make = (list: Watcher[]) =>
    class {
      observe = vi.fn();
      disconnect = vi.fn();
      constructor(public callback: Watcher['callback'], public options?: unknown) {
        list.push(this);
      }
    };
  vi.stubGlobal('IntersectionObserver', make(created.intersection));
  vi.stubGlobal('ResizeObserver', make(created.resize));
  return { created, show: (visible: boolean) => created.intersection.forEach((w) => w.callback([{ isIntersecting: visible }])) };
}

/** Simula que la pestaña se oculta o vuelve a verse; `restoreHidden` lo deshace. */
export function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}
export const restoreHidden = () => Reflect.deleteProperty(document, 'hidden');
