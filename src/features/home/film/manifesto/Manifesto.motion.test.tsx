import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { currentLook } from '../../../../components/layout/toneRegistry';
import { Manifesto } from './Manifesto';
import { fakeFrames, fakeViewport } from './testDoubles';

const section = () => document.querySelector<HTMLElement>('[data-chapter="1"]') as HTMLElement;
const layers = () => [...section().querySelectorAll<HTMLElement>('[data-layer]')].map((layer) => layer.dataset.layer);
const inline = () => [...section().querySelectorAll<HTMLElement>('[data-word], [data-layer]')].map((node) => node.getAttribute('style') ?? '');

afterEach(() => vi.restoreAllMocks());

describe('Manifiesto (capítulo 1): animación y tono', () => {
  it('al entrar en vista anima por referencia; el tono pasa a papel cuando el papel cubre la sección', () => {
    const frames = fakeFrames();
    const view = fakeViewport();
    // El header mira qué sección cruza su línea media (y = 32 px): aquí, la del manifiesto.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 800 } as DOMRect);
    render(<Manifesto />);
    expect(currentLook()).toEqual({ tone: 'noche', float: true });

    act(() => {
      view.show(true);
      frames.run(1000);
      frames.advance(1000, 600);
    });
    expect(section().querySelector<HTMLElement>('[data-word="0"]')?.style.transform).toMatch(/^translate\(/);
    expect(section()).toHaveAttribute('data-tone', 'noche');

    act(() => void frames.advance(1600, 100)); // 0,7 s: la elipse ya contiene la esquina de arriba a la izquierda
    expect(section()).toHaveAttribute('data-tone', 'papel');
    expect(currentLook()).toEqual({ tone: 'papel', float: true });
    expect(section()).not.toHaveAttribute('data-done');
    expect(frames.pending()).toBe(1); // cambiar el tono no reinicia ni detiene la animación
  });

  it('al terminar queda el estado final: solo la capa papel, sin estilos en línea y sin cuadros pendientes', () => {
    const frames = fakeFrames();
    const view = fakeViewport();
    render(<Manifesto />);
    expect(layers()).toEqual(['noche', 'papel']);
    act(() => {
      view.show(true);
      frames.run(1000);
      frames.advance(1000, 1300);
    });
    expect(section()).toHaveAttribute('data-done');
    expect(section()).toHaveAttribute('data-tone', 'papel');
    expect(layers()).toEqual(['papel']);
    expect(inline().join('')).toBe('');
    expect(frames.pending()).toBe(0);
  });

  it('al desmontar cancela el cuadro pendiente y deja de observar', () => {
    const frames = fakeFrames();
    const view = fakeViewport();
    const { unmount } = render(<Manifesto />);
    act(() => {
      view.show(true);
      frames.run(1000);
    });
    const pendingId = frames.request.mock.results.at(-1)?.value as number;
    unmount();
    expect(frames.cancel).toHaveBeenCalledWith(pendingId);
    expect(frames.pending()).toBe(0);
    expect(view.observers()).toBe(0);
  });
});
