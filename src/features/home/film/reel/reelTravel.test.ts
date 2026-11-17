import { describe, expect, it, vi } from 'vitest';
import { createMotion } from './reelMotion';
import { createFollower, readTravel, syncScroll, travelIndex, travelOffset, travelProgress } from './reelTravel';

const N = 14;
let scrolled = 0;

/** Un bloque con la caja que jsdom no calcula: `top` en pantalla (menos lo desplazado) y alto de maquetación. */
function block(top: number, height: number): HTMLElement {
  const element = document.createElement('div');
  const box = () => ({ top: top - scrolled, bottom: top - scrolled + height, left: 0, right: 0, width: 0, height, x: 0, y: top - scrolled });
  element.getBoundingClientRect = () => ({ ...box(), toJSON: () => ({}) });
  Object.defineProperty(element, 'offsetHeight', { value: height });
  return element;
}

describe('seguir el scroll del capítulo', () => {
  it('cada cambio de scroll fija el objetivo por el camino corto del anillo; si no cambia, no pisa al usuario', () => {
    const motion = createMotion();
    const follow = createFollower(block(0, 2700), block(0, 900), motion, N);
    follow();
    expect(motion.target).toBeCloseTo(0, 12);
    Object.assign(motion, { rest: 1 });
    scrolled = 900;
    follow();
    expect([motion.target, motion.rest]).toEqual([6.5, 0]);
    Object.assign(motion, { target: 9, rest: 1 }); // el usuario arrastró: sin scroll nuevo, se respeta
    follow();
    expect([motion.target, motion.rest]).toEqual([9, 1]);
    Object.assign(motion, { target: 14 }); // dio la vuelta al anillo: el 14.º queda justo detrás
    scrolled = 1800;
    follow();
    expect(motion.target).toBe(13);
    scrolled = 0;
  });

  it('sin recorrido no toca el objetivo', () => {
    const motion = createMotion();
    motion.target = 5;
    createFollower(block(-300, 900), block(-300, 900), motion, N)();
    expect(motion.target).toBe(5);
  });
});

describe('recorrido del capítulo', () => {
  it('convierte el scroll nativo en avance: 0 al fijarse la pantalla y 1 al acabar los 200svh', () => {
    expect(travelProgress(0, 1800)).toBeCloseTo(0, 12);
    expect(travelProgress(-900, 1800)).toBe(0.5);
    expect(travelProgress(-1800, 1800)).toBe(1);
  });

  it('antes y después del recorrido no avanza más', () => {
    expect(travelProgress(300, 1800)).toBe(0);
    expect(travelProgress(-2500, 1800)).toBe(1);
  });

  it('sin recorrido (movimiento reducido o rejilla) no hay avance', () => {
    expect(travelProgress(-500, 0)).toBe(0);
    expect(travelProgress(-500, -64)).toBe(0);
  });

  it('reparte los 14 módulos en el recorrido, del primero al último', () => {
    expect([0, 0.5, 1].map((progress) => travelIndex(progress, N))).toEqual([0, 6.5, 13]);
  });

  it('el scroll que le toca a un módulo, envuelto al anillo', () => {
    expect([0, 13, 14, -1].map((index) => travelOffset(index, N, 1800))).toEqual([0, 1800, 0, 1800]);
    expect(travelOffset(6.5, N, 1800)).toBeCloseTo(900, 9);
  });

  it('readTravel mide dónde va la sección y cuánto recorrido deja la pantalla sticky', () => {
    expect(readTravel(block(-450, 2700), block(0, 900))).toEqual({ top: -450, travel: 1800 });
    expect(readTravel(block(120, 900), block(120, 900))).toEqual({ top: 120, travel: 0 });
  });
});

describe('syncScroll', () => {
  it('lleva la página al módulo, sin animación ni bloqueo', () => {
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    vi.stubGlobal('scrollY', 5000);
    syncScroll(block(-450, 2700), block(0, 900), 13, N);
    expect(scrollTo).toHaveBeenCalledWith({ top: 5000 - 450 + 1800, behavior: 'instant' });
    syncScroll(block(-450, 2700), block(0, 900), 14, N); // el 15.º es el primero
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 4550, behavior: 'instant' });
  });

  it('sin recorrido no mueve la página', () => {
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    syncScroll(block(0, 900), block(0, 900), 5, N);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
