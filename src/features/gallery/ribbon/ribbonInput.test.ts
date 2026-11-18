import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bindInput, keyAction, photoIndexOf } from './ribbonInput';

const mount = () => {
  const frame = document.createElement('div');
  frame.innerHTML = '<button data-ribbon-index="0"><span>A</span></button><button data-ribbon-index="1">B</button>';
  document.body.append(frame, document.createElement('a'));
  const handlers = { onWheel: vi.fn(), onActivate: vi.fn(), onFocus: vi.fn() };
  const unbind = bindInput(frame, handlers);
  const [first, second] = [...frame.querySelectorAll('button')] as [HTMLButtonElement, HTMLButtonElement];
  return { frame, handlers, unbind, first, second };
};
afterEach(() => document.body.replaceChildren());

describe('teclas, rueda, activación y foco de la cinta', () => {
  it('flechas izquierda y derecha, y Home; Escape, Enter y el resto no son de la cinta', () => {
    expect(['ArrowRight', 'ArrowLeft', 'Home'].map(keyAction)).toEqual(['next', 'previous', 'home']);
    for (const key of ['Escape', 'Enter', ' ', 'ArrowUp', 'ArrowDown', 'End', 'Tab']) expect(keyAction(key)).toBeNull();
  });

  it('la rueda llega en píxeles del eje dominante; la vertical nunca se cancela: la página sigue', () => {
    const spy = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const { frame, handlers } = mount();
    handlers.onWheel.mockReturnValue(true);
    expect(spy).toHaveBeenCalledWith('wheel', expect.any(Function), { passive: false });
    expect(fireEvent.wheel(frame, { deltaY: 2, deltaMode: 1 })).toBe(true);
    expect(handlers.onWheel).toHaveBeenCalledWith(32);
    spy.mockRestore();
  });

  it('el gesto horizontal que usa la cinta se cancela (no pasa de página en el historial); el que no usa, no', () => {
    const { frame, handlers } = mount();
    handlers.onWheel.mockReturnValueOnce(true).mockReturnValueOnce(false);
    expect(fireEvent.wheel(frame, { deltaX: 30, deltaY: 4 })).toBe(false);
    expect(fireEvent.wheel(frame, { deltaX: 30, deltaY: 4 })).toBe(true); // movimiento reducido: la cinta no la usa
    expect(handlers.onWheel.mock.calls).toEqual([[30], [30]]);
  });

  it('la activación dice qué foto, y si vino del teclado (detail 0) o del puntero', () => {
    const { frame, handlers, first, second } = mount();
    fireEvent.click(first.querySelector('span') as HTMLElement, { detail: 1 });
    fireEvent.click(second, { detail: 0 });
    fireEvent.click(frame, { detail: 1 });
    expect(handlers.onActivate.mock.calls).toEqual([[0, false], [1, true]]);
    expect(photoIndexOf(null)).toBe(-1);
  });

  it('sigue el foco entre los botones y avisa cuando sale de la cinta', () => {
    const { handlers, first, second } = mount();
    first.focus();
    second.focus();
    (document.querySelector('a') as HTMLElement).setAttribute('href', '#');
    (document.querySelector('a') as HTMLElement).focus();
    expect(handlers.onFocus.mock.calls.map(([index]) => index)).toEqual([0, 1, -1]);
    expect(typeof handlers.onFocus.mock.calls[0]?.[1]).toBe('boolean');
  });

  it('al desconectar ya no escucha nada', () => {
    const { frame, handlers, unbind, first } = mount();
    unbind();
    fireEvent.wheel(frame, { deltaY: 10 });
    fireEvent.click(first, { detail: 1 });
    first.focus();
    expect([handlers.onWheel, handlers.onActivate, handlers.onFocus].map((fn) => fn.mock.calls.length)).toEqual([0, 0, 0]);
  });
});
