// Dobles de prueba del capítulo 1: el tiempo y la pantalla los maneja la prueba, no jsdom.
// Los `stubGlobal` se deshacen solos al terminar cada prueba (src/test/setup.ts).
import { vi } from 'vitest';

/** Cola manual de requestAnimationFrame: los cuadros solo corren cuando la prueba los pide. */
export function fakeFrames() {
  const queue = new Map<number, FrameRequestCallback>();
  let lastId = 0;
  const request = vi.fn((callback: FrameRequestCallback) => {
    lastId += 1;
    queue.set(lastId, callback);
    return lastId;
  });
  const cancel = vi.fn((id: number) => void queue.delete(id));
  vi.stubGlobal('requestAnimationFrame', request);
  vi.stubGlobal('cancelAnimationFrame', cancel);
  return {
    request,
    cancel,
    pending: () => queue.size,
    /** Corre los cuadros pendientes con la marca de tiempo `now` (ms). */
    run(now: number) {
      const callbacks = [...queue.values()];
      queue.clear();
      callbacks.forEach((callback) => callback(now));
    },
    /** Corre cuadros cada 12,5 ms desde `from` hasta `from + ms`; devuelve la última marca. */
    advance(from: number, ms: number) {
      for (let now = from + 12.5; now <= from + ms; now += 12.5) this.run(now);
      return from + ms;
    },
  };
}

/** IntersectionObserver de mentira: `show(true | false)` avisa a todos los observadores vivos. */
export function fakeViewport() {
  const live = new Set<IntersectionObserverCallback>();
  class FakeObserver {
    private readonly callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }
    observe = () => void live.add(this.callback);
    unobserve = () => void live.delete(this.callback);
    disconnect = () => void live.delete(this.callback);
    takeRecords = () => [];
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  return {
    observers: () => live.size,
    show(visible: boolean) {
      const entry = { isIntersecting: visible, intersectionRatio: visible ? 1 : 0 } as IntersectionObserverEntry;
      [...live].forEach((callback) => callback([entry], {} as IntersectionObserver));
    },
  };
}

/** Sección mínima con las dos capas y 5 palabras en cada una, como la que pinta Manifesto. */
export function buildStage() {
  const section = document.createElement('section');
  const words = [0, 1, 2, 3, 4].map((i) => `<i data-word="${i}"></i>`).join('');
  section.innerHTML = `<div data-layer="noche">${words}</div><div data-layer="papel">${words}</div>`;
  document.body.append(section);
  return {
    section,
    words: [...section.querySelectorAll<HTMLElement>('[data-word]')],
    paper: section.lastElementChild as HTMLElement,
  };
}

/** Pestaña oculta o visible, con su evento. Sin argumento devuelve `document.hidden` a jsdom. */
export function setTabHidden(hidden?: boolean) {
  if (hidden === undefined) Reflect.deleteProperty(document, 'hidden');
  else Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
  if (hidden !== undefined) document.dispatchEvent(new Event('visibilitychange'));
}
