// Dobles de prueba del capítulo 2: cuadros, pantalla, tamaño y medidas los maneja la prueba.
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
    run() {
      const callbacks = [...queue.values()];
      queue.clear();
      callbacks.forEach((callback) => callback(0));
    },
  };
}

/** Un observador de mentira (IntersectionObserver o ResizeObserver): `fire` avisa a los vivos. */
function fakeObserver<Entry>(name: 'IntersectionObserver' | 'ResizeObserver') {
  const live = new Set<(entries: Entry[]) => void>();
  class FakeObserver {
    private readonly callback: (entries: Entry[]) => void;
    constructor(callback: (entries: Entry[]) => void) {
      this.callback = callback;
    }
    observe = () => void live.add(this.callback);
    unobserve = () => void live.delete(this.callback);
    disconnect = () => void live.delete(this.callback);
  }
  vi.stubGlobal(name, FakeObserver);
  return { observers: () => live.size, fire: (entry: Entry) => [...live].forEach((callback) => callback([entry])) };
}

/** Pantalla de mentira: `show(true | false)` dice si la sección se ve. */
export function fakeViewport() {
  const { observers, fire } = fakeObserver<Pick<IntersectionObserverEntry, 'isIntersecting'>>('IntersectionObserver');
  return { observers, show: (visible: boolean) => fire({ isIntersecting: visible }) };
}

/** Cambios de tamaño de mentira: `resize()` avisa como lo haría ResizeObserver. */
export function fakeResize() {
  const { observers, fire } = fakeObserver<object>('ResizeObserver');
  return { observers, resize: () => fire({}) };
}

/** Pestaña oculta o visible, con su evento. Sin argumento devuelve `document.hidden` a jsdom. */
export function setTabHidden(hidden?: boolean) {
  if (hidden === undefined) Reflect.deleteProperty(document, 'hidden');
  else Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
  if (hidden !== undefined) document.dispatchEvent(new Event('visibilitychange'));
}

/** Medidas de mentira (jsdom no maqueta): sección de 5000 px, pantalla de 1000 px y `top` movible. */
export function fakeLayout(outer: HTMLElement) {
  const layout = { top: 0, height: 5000, screen: 1000 };
  const sticky = outer.querySelector<HTMLElement>('[data-flight="sticky"]') as HTMLElement;
  Object.defineProperty(outer, 'offsetHeight', { configurable: true, get: () => layout.height });
  Object.defineProperty(sticky, 'clientHeight', { configurable: true, get: () => layout.screen });
  outer.getBoundingClientRect = () => ({ top: layout.top, bottom: layout.top + layout.height }) as DOMRect;
  return {
    layout,
    /** Mueve la sección y avisa con un evento de scroll, como el navegador. */
    scrollTo(top: number) {
      layout.top = top;
      window.dispatchEvent(new Event('scroll'));
    },
  };
}

/** Sección mínima con la estructura que pinta PhotoFlight: sticky > cámara > espacio > tarjetas. */
export function buildFlight(count = 4) {
  const outer = document.createElement('section');
  const cards = '<div data-flight="card"></div>'.repeat(count);
  outer.innerHTML = `<div data-flight="sticky"><div><div data-flight="space">${cards}</div></div></div>`;
  document.body.append(outer);
  const space = outer.querySelector<HTMLElement>('[data-flight="space"]') as HTMLElement;
  return { outer, space, cards: [...space.children] as HTMLElement[], ...fakeLayout(outer) };
}

/** Todo el montaje de una prueba del vuelo: cuadros, pantalla, tamaño y la sección con sus medidas. */
export function flightRig() {
  const [frames, view, size, stage] = [fakeFrames(), fakeViewport(), fakeResize(), buildFlight()];
  /** Lo que se ve: el transform del espacio y, por tarjeta, su opacidad o «oculta». */
  const seen = () => ({
    space: stage.space.style.transform,
    cards: stage.cards.map((card) => (card.style.visibility === 'hidden' ? 'oculta' : card.style.opacity)),
  });
  return { frames, view, size, ...stage, seen };
}
