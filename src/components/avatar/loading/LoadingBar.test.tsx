import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoadingBar } from './LoadingBar';

/** rAF de mentira: cada `step` corre un cuadro de 16 ms. */
function fakeFrames() {
  let queue: FrameRequestCallback[] = [];
  let now = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => queue.push(cb));
  const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  return {
    cancel,
    pending: () => queue.length,
    step(times = 1) {
      for (let k = 0; k < times; k += 1) {
        const run = queue;
        queue = [];
        now += 16;
        act(() => run.forEach((cb) => cb(now)));
      }
    },
  };
}

const bar = () => screen.getByRole('progressbar', { name: 'Progreso de la carga' });

afterEach(() => vi.restoreAllMocks());

describe('barra de carga viva', () => {
  it('sale con una astilla y sube con el muelle hasta el progreso real', () => {
    const frames = fakeFrames();
    render(<LoadingBar target={0.5} reduced={false} />);
    expect(bar()).toHaveAttribute('aria-valuenow', '6');
    frames.step(3);
    const early = Number(bar().getAttribute('aria-valuenow'));
    expect(early).toBeGreaterThan(6);
    frames.step(90);
    expect(bar()).toHaveAttribute('aria-valuenow', '50');
    expect(frames.pending()).toBe(0); // llegó: suelta el rAF
  });

  it('el relleno y la punta solo se mueven con transform', () => {
    const frames = fakeFrames();
    const { container } = render(<LoadingBar target={1} reduced={false} />);
    frames.step(120);
    expect(container.querySelector<HTMLElement>('.loading-bar__fill')?.style.transform).toBe('translate3d(0%, 0px, 0px)');
    expect(container.querySelector<HTMLElement>('.loading-bar__rail')?.style.transform).toBe('translate3d(100%, 0px, 0px)');
    expect(container.querySelectorAll('.loading-bar__spark')).toHaveLength(5);
  });

  it('con movimiento reducido va directo, sin chispas ni rAF', () => {
    const frames = fakeFrames();
    const { container } = render(<LoadingBar target={0.7} reduced />);
    expect(bar()).toHaveAttribute('aria-valuenow', '70');
    expect(frames.pending()).toBe(0);
    expect(container.querySelectorAll('.loading-bar__spark')).toHaveLength(0);
  });

  it('al desmontarse suelta el cuadro pendiente', () => {
    const frames = fakeFrames();
    const { unmount } = render(<LoadingBar target={0.9} reduced={false} />);
    frames.step(2);
    unmount();
    expect(frames.cancel).toHaveBeenCalled();
  });
});
