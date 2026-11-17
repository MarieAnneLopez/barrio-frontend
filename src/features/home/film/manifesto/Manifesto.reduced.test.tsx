import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { currentLook } from '../../../../components/layout/toneRegistry';
import { useA11yStore } from '../../../../store/a11yStore';
import { Manifesto } from './Manifesto';
import { fakeFrames, fakeViewport } from './testDoubles';

const section = () => document.querySelector<HTMLElement>('[data-chapter="1"]') as HTMLElement;
const layers = () => [...section().querySelectorAll<HTMLElement>('[data-layer]')].map((layer) => layer.dataset.layer);
const inline = () => [...section().querySelectorAll<HTMLElement>('[data-word], [data-layer]')].map((node) => node.getAttribute('style') ?? '');

afterEach(() => {
  vi.restoreAllMocks();
  act(() => useA11yStore.setState({ reducedMotion: false }));
});

describe('Manifiesto (capítulo 1): movimiento reducido', () => {
  it('estado final inmediato: todo papel, tono papel desde el inicio y ni un solo cuadro pedido', () => {
    act(() => useA11yStore.setState({ reducedMotion: true }));
    const frames = fakeFrames();
    const view = fakeViewport();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 800 } as DOMRect);
    render(<Manifesto />);
    act(() => view.show(true));

    expect(section()).toHaveAttribute('data-done');
    expect(section()).toHaveAttribute('data-tone', 'papel');
    expect(currentLook()).toEqual({ tone: 'papel', float: true });
    expect(layers()).toEqual(['papel']);
    expect(inline().join('')).toBe('');
    expect(frames.request).not.toHaveBeenCalled();
  });

  it('si se pide a media animación, salta al estado final y suelta el cuadro pendiente', () => {
    const frames = fakeFrames();
    const view = fakeViewport();
    render(<Manifesto />);
    act(() => {
      view.show(true);
      frames.run(1000);
      frames.advance(1000, 200);
    });
    expect(section()).not.toHaveAttribute('data-done');

    act(() => useA11yStore.setState({ reducedMotion: true }));
    expect(section()).toHaveAttribute('data-done');
    expect(section()).toHaveAttribute('data-tone', 'papel');
    expect(inline().join('')).toBe('');
    expect(frames.pending()).toBe(0);
  });
});
