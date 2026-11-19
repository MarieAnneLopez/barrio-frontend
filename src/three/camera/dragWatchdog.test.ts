// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEAD_DRAG_MS, DEAD_DRAG_PX, isDeadDrag, watchDrags } from './dragWatchdog';

describe('vigilante de la cámara (el mapa nunca queda sordo)', () => {
  it('solo duda con un arrastre largo, de varios cuadros y sin que la cámara se mueva', () => {
    expect(isDeadDrag(DEAD_DRAG_PX, DEAD_DRAG_MS, 0)).toBe(true);
    expect(isDeadDrag(DEAD_DRAG_PX - 1, DEAD_DRAG_MS, 0)).toBe(false);
    expect(isDeadDrag(DEAD_DRAG_PX, DEAD_DRAG_MS - 1, 0)).toBe(false);
    expect(isDeadDrag(DEAD_DRAG_PX, DEAD_DRAG_MS, 0.5)).toBe(false);
  });

  describe('sobre el lienzo', () => {
    const canvas = document.createElement('div');
    let pose = [0, 0, 0];
    let stop = () => {};
    afterEach(() => stop());

    const fire = (target: EventTarget, type: string, init: object) => {
      const event = new MouseEvent(type, { bubbles: true });
      for (const [key, value] of Object.entries({ pointerType: 'mouse', ...init })) {
        Object.defineProperty(event, key, { value });
      }
      target.dispatchEvent(event);
    };
    const start = () => {
      pose = [0, 0, 0];
      const reset = vi.fn();
      stop = watchDrags(canvas, () => pose, reset);
      fire(canvas, 'pointerdown', { clientX: 100, clientY: 100, timeStamp: 1000 });
      return reset;
    };

    it('pide rehacer los controles cuando el ratón arrastra y la cámara no responde', () => {
      const reset = start();
      fire(document, 'pointermove', { clientX: 220, clientY: 100, buttons: 1, timeStamp: 1100 });
      expect(reset).not.toHaveBeenCalled(); // aún es pronto
      fire(document, 'pointermove', { clientX: 260, clientY: 100, buttons: 1, timeStamp: 1400 });
      fire(document, 'pointermove', { clientX: 300, clientY: 100, buttons: 1, timeStamp: 1500 });
      expect(reset).toHaveBeenCalledTimes(1);
    });

    it('no hace nada si la cámara se movió, si no hay botón apretado o si el dedo es táctil', () => {
      const reset = start();
      pose = [5, 0, 0];
      fire(document, 'pointermove', { clientX: 300, clientY: 100, buttons: 1, timeStamp: 1500 });
      pose = [0, 0, 0];
      fire(document, 'pointerup', {});
      fire(document, 'pointermove', { clientX: 400, clientY: 100, buttons: 0, timeStamp: 1600 });
      fire(canvas, 'pointerdown', { clientX: 100, clientY: 100, timeStamp: 2000, pointerType: 'touch' });
      fire(document, 'pointermove', { clientX: 400, clientY: 100, buttons: 1, timeStamp: 2500 });
      expect(reset).not.toHaveBeenCalled();
    });

    it('si la ventana pierde el foco con el botón apretado, rehace los controles', () => {
      const reset = start();
      window.dispatchEvent(new Event('blur'));
      expect(reset).toHaveBeenCalledTimes(1);
    });
  });
});
