import { fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindDrag, type DragHandlers } from './ribbonPointer';

let [clock, frame, button] = [0, document.createElement('div'), document.createElement('button')];
const handlers = () => ({ onPress: vi.fn<DragHandlers['onPress']>(), onDrag: vi.fn<DragHandlers['onDrag']>(), onRelease: vi.fn<DragHandlers['onRelease']>() });
const at = (clientX: number, extra: Record<string, number> = {}) => ({ pointerId: 1, button: 0, clientX, clientY: 100, ...extra });

beforeEach(() => {
  [clock, frame, button] = [1000, document.createElement('div'), document.createElement('button')];
  frame.appendChild(button);
  document.body.appendChild(frame);
  Object.assign(frame, { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn(), hasPointerCapture: () => true });
});
afterEach(() => frame.remove());

describe('arrastre de la cinta', () => {
  it('por debajo de 6 px es un clic: no captura el puntero ni arrastra, y el clic llega al botón', () => {
    const spy = handlers();
    bindDrag(frame, spy, () => clock);
    const clicked = vi.fn();
    button.addEventListener('click', clicked);
    fireEvent.pointerDown(button, at(100));
    fireEvent.pointerMove(button, at(104));
    fireEvent.pointerUp(button, at(104));
    fireEvent.click(button, { detail: 1 });
    expect(frame.setPointerCapture).not.toHaveBeenCalled();
    expect(spy.onDrag).not.toHaveBeenCalled();
    expect(spy.onRelease).toHaveBeenCalledWith(false, 0, 0, false);
    expect(clicked).toHaveBeenCalledTimes(1);
  });

  it('pasados 6 px captura el puntero y avisa el desplazamiento desde donde se pulsó', () => {
    const spy = handlers();
    bindDrag(frame, spy, () => clock);
    fireEvent.pointerDown(button, at(100));
    fireEvent.pointerMove(button, at(93));
    expect(frame.setPointerCapture).toHaveBeenCalledWith(1);
    expect(frame).toHaveAttribute('data-dragging', 'true');
    fireEvent.pointerMove(frame, at(60));
    expect(spy.onDrag.mock.calls).toEqual([[-7], [-40]]);
    fireEvent.pointerUp(frame, at(60));
    expect(frame.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(frame).not.toHaveAttribute('data-dragging');
  });

  it('al soltar da el último movimiento y cuánto hace: el lanzamiento solo vale antes de 100 ms', () => {
    const spy = handlers();
    bindDrag(frame, spy, () => clock);
    fireEvent.pointerDown(frame, at(300));
    fireEvent.pointerMove(frame, at(280));
    clock += 16;
    fireEvent.pointerMove(frame, at(268));
    clock += 40;
    fireEvent.pointerUp(frame, at(268));
    expect(spy.onRelease).toHaveBeenLastCalledWith(true, -12, 40, false);
  });

  it('ignora el clic sintético que cierra un arrastre, pero no el del teclado', () => {
    bindDrag(frame, handlers(), () => clock);
    const clicked = vi.fn();
    button.addEventListener('click', clicked);
    fireEvent.pointerDown(button, at(100));
    fireEvent.pointerMove(button, at(50));
    fireEvent.pointerUp(frame, at(50));
    fireEvent.click(button, { detail: 1 });
    expect(clicked).not.toHaveBeenCalled();
    fireEvent.click(button, { detail: 0 });
    expect(clicked).toHaveBeenCalledTimes(1);
  });

  it('si el navegador se queda el gesto (desplazar la página con el dedo), se suelta sin lanzar', () => {
    const spy = handlers();
    bindDrag(frame, spy, () => clock);
    fireEvent.pointerDown(frame, at(100));
    fireEvent.pointerMove(frame, at(80));
    fireEvent.pointerCancel(frame, at(80));
    expect(spy.onRelease).toHaveBeenLastCalledWith(true, -20, 0, true);
  });

  it('ignora otros botones del ratón y otros punteros; al desconectar ya no escucha nada', () => {
    const spy = handlers();
    const unbind = bindDrag(frame, spy, () => clock);
    fireEvent.pointerDown(frame, at(100, { button: 2 }));
    expect(spy.onPress).not.toHaveBeenCalled();
    fireEvent.pointerDown(frame, at(100));
    fireEvent.pointerMove(frame, at(10, { pointerId: 2 }));
    expect(spy.onDrag).not.toHaveBeenCalled();
    fireEvent.pointerUp(frame, at(100));
    unbind();
    fireEvent.pointerDown(frame, at(100));
    expect(spy.onPress).toHaveBeenCalledTimes(1);
  });
});
