import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { frameTransforms } from '../sequences';
import { BarRunner, type BarRunnerHandle } from './BarRunner';
import { LoadingBar } from './LoadingBar';
import { runnerFrame } from './runnerFrame';

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

/** Ancho real de la barra en px (jsdom no maqueta): min(32rem, 82vw) en una pantalla ancha. */
const barWidth = (px: number) =>
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(function width(this: Element) {
    return this.classList.contains('loading-bar') ? px : 0;
  });
const bar = () => screen.getByRole('progressbar', { name: 'Progreso de la carga' });
const railPx = (rail: HTMLElement | null) => Number(/^translate3d\((-?\d+)px, 0px, 0px\)$/.exec(rail?.style.transform ?? '')?.[1]);

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

  it('el relleno y la punta solo se mueven con transform; la punta, en px enteros', () => {
    const frames = fakeFrames();
    barWidth(512);
    const { container } = render(<LoadingBar target={1} reduced={false} />);
    frames.step(120);
    expect(container.querySelector<HTMLElement>('.loading-bar__fill')?.style.transform).toBe('translate3d(0%, 0px, 0px)');
    expect(container.querySelector<HTMLElement>('.loading-bar__rail')?.style.transform).toBe('translate3d(512px, 0px, 0px)');
    expect(container.querySelectorAll('.loading-bar__spark')).toHaveLength(5);
  });

  // Auditoría MM-09: el riel se movía en cada rAF, pero el cuadro de la Mini Marie solo cambiaba con
  // el porcentaje redondeado: unos 14 de los 32 por zancada y hasta 5 px deslizándose con la pose quieta.
  it('la Mini Marie de la punta toma su cuadro de la posición real en cada rAF', () => {
    const frames = fakeFrames();
    barWidth(512);
    const runner = createRef<BarRunnerHandle>();
    const travel = vi.fn((px: number) => runner.current?.travel(px));
    const { container } = render(<LoadingBar target={0.9} reduced={false} rider={<BarRunner ref={runner} atlas={210} />} onTravel={travel} />);
    const pose = () => ['.sequence__strip', '.sequence__rows'].map((part) => container.querySelector<HTMLElement>(part)?.style.transform);
    for (let k = 0; k < 60; k += 1) {
      frames.step();
      const px = railPx(container.querySelector('.loading-bar__rail'));
      expect(Number.isInteger(px)).toBe(true);
      expect(travel).toHaveBeenLastCalledWith(px);
      const { across, down } = frameTransforms('run', 120, runnerFrame(px));
      expect(pose()).toEqual([across, down]);
    }
  });

  it('con movimiento reducido va directo, sin chispas ni rAF, y la Mini Marie no se mueve', () => {
    const frames = fakeFrames();
    const travel = vi.fn();
    const { container } = render(<LoadingBar target={0.7} reduced onTravel={travel} />);
    expect(bar()).toHaveAttribute('aria-valuenow', '70');
    expect(frames.pending()).toBe(0);
    expect(container.querySelectorAll('.loading-bar__spark')).toHaveLength(0);
    expect(travel).not.toHaveBeenCalled();
  });

  it('al desmontarse suelta el cuadro pendiente', () => {
    const frames = fakeFrames();
    const { unmount } = render(<LoadingBar target={0.9} reduced={false} />);
    frames.step(2);
    unmount();
    expect(frames.cancel).toHaveBeenCalled();
  });
});
