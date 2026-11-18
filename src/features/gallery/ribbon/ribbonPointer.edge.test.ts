import { fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindDrag } from './ribbonPointer';

const at = (clientX: number) => ({ pointerId: 1, button: 0, clientX, clientY: 100 });
let frame = document.createElement('div');
const handlers = { onPress: vi.fn(), onDrag: vi.fn(), onRelease: vi.fn() };

beforeEach(() => {
  frame = document.createElement('div');
  document.body.appendChild(frame);
  Object.assign(frame, { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn(), hasPointerCapture: () => false });
  Object.values(handlers).forEach((handler) => handler.mockClear());
});
afterEach(() => frame.remove());

describe('arrastre de la cinta: un gesto que acaba fuera del escenario', () => {
  it('soltar fuera antes de los 6 px no deja la pulsación colgada: ni arrastra al volver ni se come la siguiente', () => {
    const unbind = bindDrag(frame, handlers, () => 0);
    fireEvent.pointerDown(frame, at(3)); // a 3 px del borde: sale sin llegar a capturar el puntero
    fireEvent.pointerUp(document.body, at(-40));
    expect(handlers.onRelease).toHaveBeenCalledWith(false, 0, 0, false);
    fireEvent.pointerMove(frame, at(200)); // vuelve sin pulsar: no es un arrastre
    expect(handlers.onDrag).not.toHaveBeenCalled();
    fireEvent.pointerDown(frame, at(200));
    expect(handlers.onPress).toHaveBeenCalledTimes(2);
    unbind();
  });

  it('al desconectar en mitad de una pulsación no deja oyentes en la ventana', () => {
    const [added, removed] = [vi.spyOn(window, 'addEventListener'), vi.spyOn(window, 'removeEventListener')];
    const unbind = bindDrag(frame, handlers, () => 0);
    fireEvent.pointerDown(frame, at(100));
    unbind();
    const pairs = (spy: typeof added) => spy.mock.calls.filter(([type]) => /^pointer/.test(String(type))).map(([type, fn]) => [type, fn]);
    expect(pairs(added).length).toBeGreaterThan(0);
    expect(pairs(removed)).toEqual(expect.arrayContaining(pairs(added)));
    fireEvent.pointerUp(document.body, at(100));
    expect(handlers.onRelease).not.toHaveBeenCalled();
  });
});
