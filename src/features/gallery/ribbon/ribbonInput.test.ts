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

  it('la rueda se escucha en pasivo y llega en píxeles del eje dominante', () => {
    const spy = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const { frame, handlers } = mount();
    expect(spy).toHaveBeenCalledWith('wheel', expect.any(Function), { passive: true });
    fireEvent.wheel(frame, { deltaY: 2, deltaMode: 1 });
    expect(handlers.onWheel).toHaveBeenCalledWith(32);
    spy.mockRestore();
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
