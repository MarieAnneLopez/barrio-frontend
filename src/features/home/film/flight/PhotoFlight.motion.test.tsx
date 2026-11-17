import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useA11yStore } from '../../../../store/a11yStore';
import { PhotoFlight } from './PhotoFlight';
import { fakeFrames, fakeLayout, fakeViewport } from './testDoubles';

const section = () => document.querySelector<HTMLElement>('[data-chapter="2"]') as HTMLElement;
const space = () => section().querySelector<HTMLElement>('[data-flight="space"]') as HTMLElement;
const cards = () => [...section().querySelectorAll<HTMLElement>('[data-flight="card"]')];
/** Estilos que escribe el vuelo; la proporción de cada tarjeta (--flight-ratio) no cuenta. */
const flown = () => [space(), ...cards()].map((node) => node.style.transform + node.style.opacity + node.style.visibility);

afterEach(() => {
  vi.restoreAllMocks();
  act(() => useA11yStore.setState({ reducedMotion: false }));
});

describe('Vuelo entre fotos (capítulo 2): movimiento', () => {
  it('coloca el vuelo antes del primer pintado y lo mueve con el scroll', () => {
    const frames = fakeFrames();
    const view = fakeViewport();
    render(<PhotoFlight />);
    expect(space().style.transform).toBe('translate3d(0px, 0px, 30px)');
    expect(cards().map((card) => card.style.visibility)).toEqual(['visible', 'visible', 'hidden', 'hidden']);

    const { scrollTo } = fakeLayout(section());
    view.show(true);
    scrollTo(-2000); // mitad del recorrido (D = 4000)
    frames.run();
    expect(space().style.transform).toBe('translate3d(0px, 0px, 230px)');
    expect(cards().map((card) => card.style.visibility)).toEqual(['hidden', 'hidden', 'visible', 'visible']);
    expect(section()).not.toHaveAttribute('data-reduced');
  });

  it('con movimiento reducido: rejilla estática con las 4 fotos y el fondo, sin recorrido, oyentes ni cuadros', () => {
    act(() => useA11yStore.setState({ reducedMotion: true }));
    const frames = fakeFrames();
    const view = fakeViewport();
    const add = vi.spyOn(window, 'addEventListener');
    render(<PhotoFlight />);
    view.show(true);
    window.dispatchEvent(new Event('scroll'));

    expect(section()).toHaveAttribute('data-reduced');
    expect(flown().join('')).toBe('');
    expect(cards()).toHaveLength(4);
    expect(section().querySelectorAll('img')).toHaveLength(5);
    expect(add.mock.calls.map(([name]) => name)).not.toContain('scroll');
    expect(frames.request).not.toHaveBeenCalled();
  });

  it('si se pide movimiento reducido en pleno vuelo, se quitan sus estilos y sus oyentes', () => {
    const frames = fakeFrames();
    fakeViewport();
    render(<PhotoFlight />);
    expect(flown().join('')).not.toBe('');

    act(() => useA11yStore.setState({ reducedMotion: true }));
    expect(section()).toHaveAttribute('data-reduced');
    expect(flown().join('')).toBe('');
    window.dispatchEvent(new Event('scroll'));
    expect(frames.pending()).toBe(0);
  });

  it('al desmontar cancela el cuadro pendiente, quita el oyente de scroll y deja de observar', () => {
    const frames = fakeFrames();
    const view = fakeViewport();
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<PhotoFlight />);
    view.show(true);
    expect(frames.pending()).toBe(1);

    unmount();
    expect(frames.cancel).toHaveBeenCalledTimes(1);
    expect(frames.pending()).toBe(0);
    expect(remove.mock.calls.map(([name]) => name)).toContain('scroll');
    expect(view.observers()).toBe(0);
  });
});
