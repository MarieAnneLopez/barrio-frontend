import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountReel } from './reelHarness';

vi.mock('three', async (original) => (await import('./glKit')).fakeThree(original));
afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, 'scrollY');
});

// jsdom no maqueta: aquí la sección mide 2700 px y su pantalla 900 (300svh y 100svh), el capítulo
// empieza arriba del documento y `scrolled` es lo que la página lleva desplazado.
const TRAVEL = 1800;
const scrollTo = vi.fn(({ top }: { top: number }) => void (scrolled = top));
let scrolled = 0;

function withTravel(): void {
  scrolled = 0;
  scrollTo.mockClear();
  const box = (top: number, height: number) => ({ top, bottom: top + height, left: 0, right: 1440, width: 1440, height, x: 0, y: top, toJSON: () => ({}) });
  const isSection = (node: HTMLElement) => node.matches('[data-chapter]');
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function height(this: HTMLElement) {
    return isSection(this) ? 900 + TRAVEL : 900;
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function rect(this: HTMLElement) {
    return isSection(this) ? box(-scrolled, 900 + TRAVEL) : box(64, 836);
  });
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrolled });
  vi.stubGlobal('scrollTo', scrollTo);
}
const pointerAt = (clientX: number) => ({ clientX, clientY: 480, pointerId: 1 });

describe('ModuleReel con WebGL: recorrido de 200svh', () => {
  it('el scroll nativo del capítulo se convierte en avance y, al parar, asienta en el módulo más cercano', async () => {
    const { reel, advance } = await mountReel({ before: withTravel });
    scrolled = (TRAVEL * 3.4) / 13; // entre el 4.º y el 5.º, más cerca del 4.º
    advance();
    expect(reel()).toHaveAccessibleDescription(/^Módulo 4 de 14: Zonas Verdes/);
    scrolled = TRAVEL;
    advance();
    expect(reel()).toHaveAccessibleDescription(/^Módulo 14 de 14: Barberías/);
    expect(scrollTo).not.toHaveBeenCalled(); // solo se lee el scroll: nadie lo mueve
  });

  it('las teclas llevan la página al punto del módulo, sin animación, para seguir bajando desde ahí', async () => {
    const { reel, advance } = await mountReel({ before: withTravel });
    advance(2);
    fireEvent.keyDown(reel(), { key: 'ArrowRight' });
    expect(scrollTo).toHaveBeenLastCalledWith({ top: expect.closeTo(TRAVEL / 13, 6), behavior: 'instant' });
    advance();
    expect(reel()).toHaveAccessibleDescription(/^Módulo 2 de 14/);
    fireEvent.keyDown(reel(), { key: 'ArrowLeft' });
    fireEvent.keyDown(reel(), { key: 'ArrowLeft' }); // del primero al último: la otra punta del recorrido
    expect(scrollTo).toHaveBeenLastCalledWith({ top: TRAVEL, behavior: 'instant' });
  });

  it('en el último módulo la flecha abajo se deja al navegador, para salir del capítulo', async () => {
    const { reel, advance } = await mountReel({ before: withTravel });
    scrolled = TRAVEL;
    advance();
    expect(fireEvent.keyDown(reel(), { key: 'ArrowDown' })).toBe(true);
    expect(fireEvent.keyDown(reel(), { key: 'ArrowUp' })).toBe(false);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: expect.closeTo((TRAVEL * 12) / 13, 6), behavior: 'instant' });
  });

  it('al soltar un arrastre lleva el scroll al módulo; si el navegador cancela el gesto, no lo toca', async () => {
    const { reel, advance } = await mountReel({ before: withTravel });
    advance(2);
    fireEvent.pointerDown(reel(), pointerAt(720));
    fireEvent.pointerMove(reel(), pointerAt(720 - 300));
    fireEvent.pointerCancel(reel(), pointerAt(720 - 300)); // el dedo acabó desplazando la página
    advance();
    expect(scrollTo).not.toHaveBeenCalled();
    fireEvent.pointerDown(reel(), pointerAt(720));
    fireEvent.pointerMove(reel(), pointerAt(720 - 800)); // 2,1 módulos más
    fireEvent.pointerUp(reel(), pointerAt(720 - 800));
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo.mock.calls[0]?.[0].top).toBeCloseTo((TRAVEL * 3) / 13, 6);
  });

  it('con movimiento reducido no hay recorrido: el scroll no mueve el reel ni el reel el scroll', async () => {
    const { reel, advance } = await mountReel({ before: withTravel, reducedMotion: true });
    scrolled = TRAVEL / 2;
    advance(3);
    expect(reel()).toHaveAccessibleDescription(/^Módulo 1 de 14/);
    fireEvent.keyDown(reel(), { key: 'ArrowRight' });
    advance(1);
    expect(reel()).toHaveAccessibleDescription(/^Módulo 2 de 14/);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
