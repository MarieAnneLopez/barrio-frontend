import { describe, expect, it } from 'vitest';
import { centerOn, mod, nearestIndex, slotCount, stepTarget, visibleSlots, wrapSteps } from './ribbonWrap';

const P = 10;

describe('cinta infinita con envoltura', () => {
  it('mod siempre es positivo', () => {
    expect([mod(-1, 5), mod(5, 5), mod(12, 5)]).toEqual([4, 0, 2]);
  });

  it('wrapSteps da la distancia con signo más corta por el anillo', () => {
    expect(wrapSteps(1, 200)).toBe(1);
    expect(wrapSteps(199, 200)).toBe(-1);
    expect(wrapSteps(-150, 200)).toBe(50);
    expect(wrapSteps(3, 1)).toBe(0);
  });

  it('la foto centrada es la más cercana al desplazamiento, envuelta', () => {
    expect(nearestIndex(0, P, 7)).toBe(0);
    expect(nearestIndex(14, P, 7)).toBe(1);
    expect(nearestIndex(16, P, 7)).toBe(2);
    expect(nearestIndex(-10, P, 7)).toBe(6);
    expect(nearestIndex(70, P, 7)).toBe(0);
  });

  it('flechas: anterior y siguiente desde la foto más cercana al objetivo', () => {
    expect(stepTarget(0, P, 1)).toBe(10);
    expect(stepTarget(13, P, -1)).toBe(0);
    expect(stepTarget(-4, P, -1)).toBe(-10);
  });

  it('centrar una foto (clic en la vecina, Home) va por la distancia envuelta más corta', () => {
    expect(centerOn(1, 0, P, 200)).toBe(10);
    expect(centerOn(199, 0, P, 200)).toBe(-10);
    expect(centerOn(0, 199 * P, P, 200)).toBe(200 * P);
    expect(centerOn(5, 2003, P, 200)).toBe(2050);
    expect(centerOn(0, 30, P, 1)).toBe(30);
  });

  it('las ranuras visibles cubren el rango y caben en el grupo de mallas', () => {
    expect(visibleSlots(0, P, 25)).toEqual({ first: -2, last: 2 });
    expect(visibleSlots(-1003, P, 25)).toEqual({ first: -102, last: -98 });
    for (const offset of [0, 3, 5, 7.5, -12.25, 999]) {
      const { first, last } = visibleSlots(offset, P, 25);
      expect(last - first + 1).toBeLessThanOrEqual(slotCount(P, 25));
    }
  });
});
