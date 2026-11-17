import { describe, expect, it } from 'vitest';
import { BEND_FAST, BEND_REST, bendFor, bendPoint, HALF_WIDTH, PLANE, RIPPLE } from './reelBend';

describe('plano de la tarjeta', () => {
  it('mide 2,38 × 1,5771 con 48 × 24 segmentos; halfWidth = 1,19', () => {
    expect(PLANE).toEqual({ width: 2.38, height: 1.5771, segmentsX: 48, segmentsY: 24 });
    expect(HALF_WIDTH).toBe(1.19);
  });

  it('ondulación vertical de 0,006', () => {
    expect(RIPPLE).toBe(0.006);
  });
});

describe('curvado del plano', () => {
  it('el centro no se mueve', () => {
    const center = bendPoint(0, 0, BEND_REST);
    expect(center.x).toBeCloseTo(0, 12);
    expect(center.z).toBeCloseTo(0, 12);
  });

  it('el borde sigue el arco: x = sin(angle)·radius y z += (cos(angle) − 1)·radius', () => {
    const edge = bendPoint(HALF_WIDTH, 0, 0.3); // angle = 0,30 · radius = 1,19 / 0,30 = 3,9667
    expect(edge.x).toBeCloseTo(1.17223, 4);
    expect(edge.z).toBeCloseTo(-0.17717, 4);
    const left = bendPoint(-HALF_WIDTH, 0.5, 0.3);
    expect(left.x).toBeCloseTo(-1.17223, 4);
    expect(left.z).toBeCloseTo(0.5 - 0.17717, 4);
  });

  it('con entrada rápida (bend 0,42) el borde se cierra más', () => {
    const edge = bendPoint(HALF_WIDTH, 0, 0.42); // radius = 2,8333
    expect(edge.x).toBeCloseTo(1.15532, 4);
    expect(edge.z).toBeCloseTo(-0.24625, 4);
  });

  it('a mitad de camino el ángulo es la mitad: el plano se enrolla, no se estira', () => {
    const half = bendPoint(HALF_WIDTH / 2, 0, 0.3);
    expect(half.x).toBeCloseTo(Math.sin(0.15) * (HALF_WIDTH / 0.3), 12);
    expect(half.z).toBeCloseTo((Math.cos(0.15) - 1) * (HALF_WIDTH / 0.3), 12);
  });
});

describe('curvatura según la entrada', () => {
  it('0,30 en reposo y hasta 0,42 con entrada rápida, sin pasarse', () => {
    expect([BEND_REST, BEND_FAST]).toEqual([0.3, 0.42]);
    expect(bendFor(0)).toBe(0.3);
    expect(bendFor(1)).toBeCloseTo(0.42, 12);
    expect(bendFor(25)).toBeCloseTo(0.42, 12);
    expect(bendFor(-3)).toBe(0.3);
  });

  it('crece con la energía de la entrada', () => {
    expect(bendFor(0.5)).toBeCloseTo(0.36, 12);
    expect(bendFor(0.25)).toBeLessThan(bendFor(0.75));
  });
});
