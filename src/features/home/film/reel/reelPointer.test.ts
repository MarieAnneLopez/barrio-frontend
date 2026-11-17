import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindPointer } from './reelPointer';

const handlers = { onGrab: vi.fn(), onDrag: vi.fn(), onRelease: vi.fn(), onTap: vi.fn(), onWheel: vi.fn() };
const captured = new Set<number>();
let element: HTMLDivElement;
let unbind: () => void;

/** Un contenedor de 800 × 400 px en (100, 50), con la captura de puntero que jsdom no implementa. */
function makeElement(): HTMLDivElement {
  const div = document.createElement('div');
  div.getBoundingClientRect = () => ({ left: 100, top: 50, width: 800, height: 400, right: 900, bottom: 450, x: 100, y: 50, toJSON: () => ({}) });
  div.setPointerCapture = vi.fn((id: number) => void captured.add(id));
  div.releasePointerCapture = vi.fn((id: number) => void captured.delete(id));
  div.hasPointerCapture = (id: number) => captured.has(id);
  return div;
}
const pointer = (type: string, x: number, y: number, init: PointerEventInit = {}) =>
  element.dispatchEvent(new PointerEvent(type, { pointerId: 7, clientX: x, clientY: y, bubbles: true, cancelable: true, ...init }));
const click = (x: number, y: number, detail = 1) =>
  element.dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, detail, bubbles: true, cancelable: true }));

beforeEach(() => {
  vi.clearAllMocks();
  captured.clear();
  element = makeElement();
  unbind = bindPointer(element, handlers);
});
afterEach(() => unbind());

describe('puntero sobre el reel', () => {
  it('arrastrar: captura el puntero, avisa del desplazamiento y suelta al terminar', () => {
    pointer('pointerdown', 300, 200);
    expect(element.setPointerCapture).toHaveBeenCalledWith(7);
    pointer('pointermove', 303, 201); // un temblor no es un arrastre
    expect(handlers.onDrag).not.toHaveBeenCalled();
    pointer('pointermove', 240, 230);
    expect(handlers.onDrag).toHaveBeenLastCalledWith(-60, 30);
    expect(element.dataset.dragging).toBe('true');
    pointer('pointerup', 240, 230);
    expect(handlers.onRelease).toHaveBeenCalledWith(true, false);
    expect(element.releasePointerCapture).toHaveBeenCalledWith(7);
    expect(element.dataset.dragging).toBeUndefined();
  });

  it('al cancelar (el navegador se queda el gesto para desplazar la página) libera la captura', () => {
    pointer('pointerdown', 300, 200);
    pointer('pointermove', 300, 120);
    pointer('pointercancel', 300, 120);
    expect(element.releasePointerCapture).toHaveBeenCalledWith(7);
    expect(handlers.onRelease).toHaveBeenCalledWith(true, true); // y avisa de que el gesto no era suyo
    pointer('pointermove', 300, 60);
    expect(handlers.onDrag).toHaveBeenCalledTimes(1);
  });

  it('un clic sin arrastre da el punto en coordenadas del lienzo (−1 … 1, con la y hacia arriba)', () => {
    pointer('pointerdown', 500, 250);
    pointer('pointerup', 500, 250);
    expect(handlers.onRelease).toHaveBeenCalledWith(false, false);
    click(500, 250);
    expect(handlers.onTap).toHaveBeenLastCalledWith(0, 0);
    click(900, 50);
    expect(handlers.onTap).toHaveBeenLastCalledWith(1, 1);
    click(0, 0, 0); // teclado o lector de pantalla: sin posición, vale el centro
    expect(handlers.onTap).toHaveBeenLastCalledWith(0, 0);
  });

  it('el clic que el navegador dispara tras un arrastre no cuenta', () => {
    pointer('pointerdown', 500, 250);
    pointer('pointermove', 380, 250);
    pointer('pointerup', 380, 250);
    click(380, 250);
    expect(handlers.onTap).not.toHaveBeenCalled();
    click(380, 250);
    expect(handlers.onTap).toHaveBeenCalledTimes(1);
  });

  it('solo el botón principal y un puntero a la vez', () => {
    pointer('pointerdown', 300, 200, { button: 2 });
    expect(handlers.onGrab).not.toHaveBeenCalled();
    pointer('pointerdown', 300, 200);
    pointer('pointerdown', 600, 200, { pointerId: 9 });
    pointer('pointermove', 100, 200, { pointerId: 9 });
    expect(handlers.onGrab).toHaveBeenCalledTimes(1);
    expect(handlers.onDrag).not.toHaveBeenCalled();
  });

  it('la rueda se escucha en pasivo, se avisa y nunca se cancela; unbind retira todos los oyentes', () => {
    const other = makeElement();
    const [add, remove] = [vi.spyOn(other, 'addEventListener'), vi.spyOn(other, 'removeEventListener')];
    const off = bindPointer(other, handlers);
    expect(add.mock.calls.find(([type]) => type === 'wheel')?.[2]).toEqual({ passive: true });
    const wheel = new WheelEvent('wheel', { deltaY: 120, deltaMode: 0, bubbles: true, cancelable: true });
    other.dispatchEvent(wheel);
    expect(handlers.onWheel).toHaveBeenCalledWith(120, 0);
    expect(wheel.defaultPrevented).toBe(false);
    off();
    expect(remove.mock.calls.map(([type]) => type).sort()).toEqual(add.mock.calls.map(([type]) => type).sort());
  });
});
