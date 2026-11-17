import { describe, expect, it } from 'vitest';
import { addImpulse, dragModules, dragStep, IMPULSE_LIMIT, keyAction, WHEEL_LIMIT, wheelImpulse } from './reelInput';

const N = 14;

describe('teclas', () => {
  it('flechas = un módulo, Home = el primero y Enter abre', () => {
    expect(keyAction('ArrowRight', 3, N, true)).toBe('next');
    expect(keyAction('ArrowDown', 3, N, true)).toBe('next');
    expect(keyAction('ArrowLeft', 3, N, true)).toBe('previous');
    expect(keyAction('ArrowUp', 3, N, true)).toBe('previous');
    expect(keyAction('Home', 9, N, true)).toBe('home');
    expect(keyAction('Enter', 9, N, true)).toBe('open');
  });

  it('las demás teclas siguen siendo del navegador (Tab, espacio, Fin, AvPág…)', () => {
    for (const key of [' ', 'Tab', 'End', 'PageDown', 'PageUp', 'Escape', 'a']) expect(keyAction(key, 3, N, true)).toBeNull();
  });

  it('en los extremos del recorrido, la flecha vertical devuelve el scroll a la página', () => {
    expect(keyAction('ArrowDown', 13, N, true)).toBeNull();
    expect(keyAction('ArrowUp', 0, N, true)).toBeNull();
    expect(keyAction('ArrowDown', 12, N, true)).toBe('next');
    expect(keyAction('ArrowUp', 1, N, true)).toBe('previous');
  });

  it('las flechas horizontales dan la vuelta al anillo, y sin recorrido también las verticales', () => {
    expect(keyAction('ArrowRight', 13, N, true)).toBe('next');
    expect(keyAction('ArrowLeft', 0, N, true)).toBe('previous');
    expect(keyAction('ArrowDown', 13, N, false)).toBe('next');
    expect(keyAction('ArrowUp', 0, N, false)).toBe('previous');
  });
});

describe('arrastre', () => {
  it('hacia la izquierda o hacia abajo avanza; hacia la derecha o hacia arriba retrocede', () => {
    expect(dragModules(-100, 0, 1440)).toBeGreaterThan(0);
    expect(dragModules(0, 100, 1440)).toBeGreaterThan(0);
    expect(dragModules(100, 0, 1440)).toBeLessThan(0);
    expect(dragModules(0, -100, 1440)).toBeLessThan(0);
    expect(dragModules(0, 0, 1440)).toBeCloseTo(0, 12);
  });

  it('un módulo por cada paso de arrastre: el 26 % del ancho, entre 120 y 420 px', () => {
    expect(dragStep(1440)).toBeCloseTo(374.4, 6);
    expect(dragStep(390)).toBe(120);
    expect(dragStep(2560)).toBe(420);
    expect(dragModules(-374.4, 0, 1440)).toBeCloseTo(1, 6);
    expect(dragModules(-60, 60, 390)).toBeCloseTo(1, 6);
    expect(dragModules(240, 0, 390)).toBeCloseTo(-2, 6);
  });
});

describe('impulso de la rueda', () => {
  it('sigue el sentido de la rueda', () => {
    expect(wheelImpulse(40, 0)).toBeGreaterThan(0);
    expect(wheelImpulse(-40, 0)).toBeCloseTo(-wheelImpulse(40, 0), 12);
    expect(wheelImpulse(0, 0)).toBeCloseTo(0, 12);
    expect(wheelImpulse(40, 0)).toBeLessThan(wheelImpulse(80, 0));
  });

  it('está limitado por evento, venga en píxeles, líneas o páginas', () => {
    expect(wheelImpulse(100000, 0)).toBe(WHEEL_LIMIT);
    expect(wheelImpulse(-100000, 0)).toBe(-WHEEL_LIMIT);
    expect(wheelImpulse(3, 1)).toBeCloseTo(wheelImpulse(48, 0), 12); // 3 líneas = 48 px
    expect(wheelImpulse(1, 2)).toBe(WHEEL_LIMIT); // una página
  });

  it('y el acumulado tampoco pasa de su tope, en ningún sentido', () => {
    let impulse = 0;
    for (let event = 0; event < 40; event += 1) impulse = addImpulse(impulse, wheelImpulse(120, 0));
    expect(impulse).toBe(IMPULSE_LIMIT);
    for (let event = 0; event < 80; event += 1) impulse = addImpulse(impulse, wheelImpulse(-120, 0));
    expect(impulse).toBe(-IMPULSE_LIMIT);
    expect(WHEEL_LIMIT).toBeLessThan(IMPULSE_LIMIT);
  });
});
