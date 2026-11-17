import { describe, expect, it } from 'vitest';
import { DAMPING, dampStep, MAX_DT, moduleIndex, nearestTurn, settleIndex } from './reelPhase';

const N = 14;

describe('amortiguación de la fase', () => {
  it('phase += (target − phase)·(1 − e^(−13·dt))', () => {
    expect(DAMPING).toBe(13);
    expect(dampStep(0, 1, 0.016)).toBeCloseTo(1 - Math.exp(-13 * 0.016), 12);
    expect(dampStep(0, 1, 0.016)).toBeCloseTo(0.18779, 4);
    expect(dampStep(5, 3, 0.02)).toBeCloseTo(5 - 2 * (1 - Math.exp(-0.26)), 12);
    expect(dampStep(2, 2, 0.016)).toBe(2);
  });

  it('dt se limita a 0,05 s: una pausa larga no da un salto', () => {
    expect(MAX_DT).toBe(0.05);
    expect(dampStep(0, 1, 3)).toBeCloseTo(0.47795, 4); // 1 − e^(−0,65)
    expect(dampStep(0, 1, 3)).toBe(dampStep(0, 1, 0.05));
    expect(dampStep(0, 1, 0)).toBe(0);
    expect(dampStep(0, 1, -1)).toBe(0);
  });

  it('converge al objetivo sin pasarse', () => {
    let phase = 0;
    for (let frame = 0; frame < 90; frame += 1) {
      phase = dampStep(phase, 1, 1 / 60);
      expect(phase).toBeLessThanOrEqual(1);
    }
    expect(phase).toBeCloseTo(1, 6);
  });
});

describe('asentamiento', () => {
  it('asienta en el índice más cercano', () => {
    expect([2.4, 2.5, 2.6, -0.6, 13.49].map(settleIndex)).toEqual([2, 3, 3, -1, 13]);
  });

  it('el módulo que se ve sale de la fase, envuelta al anillo', () => {
    expect([0, 6.6, 13.4, 14.2, -1, -14.3].map((phase) => moduleIndex(phase, N))).toEqual([0, 7, 13, 0, 13, 0]);
  });

  it('nearestTurn da el equivalente más cercano: el camino corto por el anillo', () => {
    expect(nearestTurn(13, 0, N)).toBe(-1);
    expect(nearestTurn(0, 13.4, N)).toBe(14);
    expect(nearestTurn(5, 5.2, N)).toBe(5);
    expect(nearestTurn(3, 31, N)).toBe(31);
  });
});
