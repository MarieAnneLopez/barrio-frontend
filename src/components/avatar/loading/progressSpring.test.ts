import { describe, expect, it } from 'vitest';
import { nextTarget, settled, springStep, type Spring } from './progressSpring';

const run = (from: Spring, target: number, seconds: number, dt = 1 / 60): Spring => {
  let state = from;
  for (let t = 0; t < seconds; t += dt) state = springStep(state, target, dt);
  return state;
};

describe('muelle de la barra de carga', () => {
  it('llega al objetivo y se asienta en menos de un segundo', () => {
    const end = run({ x: 0, v: 0 }, 0.6, 1);
    expect(end.x).toBeCloseTo(0.6, 2);
    expect(settled(end, 0.6)).toBe(true);
  });

  it('es suave: casi sin pasarse (≤ 2 %) y sin salir de 0–1', () => {
    let peak = 0;
    let state: Spring = { x: 0, v: 0 };
    for (let k = 0; k < 120; k += 1) {
      state = springStep(state, 1, 1 / 60);
      peak = Math.max(peak, state.x);
    }
    expect(peak).toBeLessThanOrEqual(1);
    const over = run({ x: 0, v: 0 }, 0.5, 2, 1 / 120);
    expect(over.x).toBeLessThan(0.51);
  });

  it('un cuadro que llega tarde avanza como mucho 50 ms: no salta', () => {
    const late = springStep({ x: 0, v: 0 }, 1, 2);
    const capped = springStep({ x: 0, v: 0 }, 1, 0.05);
    expect(late).toEqual(capped);
  });
});

describe('objetivo de la barra (progreso real)', () => {
  it('con tareas sigue su avance real y nunca retrocede', () => {
    expect(nextTarget(0.06, { busy: true, active: true, progress: 0.5 })).toBeCloseTo(0.06 + 0.94 * 0.5 * 0.96, 5); // nunca llega a 1 con tareas activas
    expect(nextTarget(0.8, { busy: true, active: true, progress: 0.2 })).toBe(0.8);
  });

  it('mientras arranca sin tareas espera; cuando ya no queda nada, se llena', () => {
    expect(nextTarget(0.06, { busy: true, active: false, progress: 1 })).toBe(0.06);
    expect(nextTarget(0.4, { busy: false, active: false, progress: 1 })).toBe(1);
  });
});
