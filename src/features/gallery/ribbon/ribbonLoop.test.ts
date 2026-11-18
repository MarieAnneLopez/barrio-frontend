import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeFrames, restoreHidden, setHidden } from './ribbonGlKit';
import { createLoop } from './ribbonLoop';

afterEach(() => restoreHidden());

describe('el único requestAnimationFrame de la cinta', () => {
  it('no pide nada hasta verse; luego un solo cuadro, y se detiene cuando ya no hay movimiento', () => {
    const frames = fakeFrames();
    let left = 3;
    const frame = vi.fn(() => (left -= 1) > 0);
    const loop = createLoop(frame);
    loop.wake();
    expect(frames.pending.size).toBe(0);
    loop.setVisible(true);
    loop.wake();
    expect(frames.pending.size).toBe(1);
    frames.run(5);
    expect(frame).toHaveBeenCalledTimes(3);
    expect(frames.pending.size).toBe(0);
  });

  it('el primer cuadro llega con dt = 0 y ninguno pasa de 0,05 s', () => {
    const frames = fakeFrames();
    const steps: number[] = [];
    const loop = createLoop((dt) => steps.push(dt) < 3);
    loop.setVisible(true);
    frames.flush(1000);
    frames.flush(1016);
    frames.flush(1400);
    expect(steps).toEqual([0, 0.016, 0.05]);
  });

  it('con la pestaña oculta se cancela, y al volver no acumula el tiempo parado', () => {
    const frames = fakeFrames();
    const steps: number[] = [];
    const loop = createLoop((dt) => steps.push(dt) > 0);
    loop.setVisible(true);
    frames.flush(1000);
    frames.flush(1016);
    setHidden(true);
    expect(frames.pending.size).toBe(0);
    setHidden(false);
    frames.flush(60000);
    expect(steps).toEqual([0, 0.016, 0]);
  });

  it('un cuadro que falla no deja el bucle sordo; dispose cancela y retira su oyente', () => {
    const frames = fakeFrames();
    const removed = vi.spyOn(document, 'removeEventListener');
    const loop = createLoop(() => {
      throw new Error('cuadro roto');
    });
    loop.setVisible(true);
    expect(() => frames.flush(1000)).toThrow('cuadro roto');
    loop.wake();
    expect(frames.pending.size).toBe(1);
    loop.dispose();
    expect(frames.pending.size).toBe(0);
    expect(removed).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});
