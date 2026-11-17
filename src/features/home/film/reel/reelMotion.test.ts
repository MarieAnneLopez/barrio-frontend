import { describe, expect, it } from 'vitest';
import { BEND_FAST, BEND_REST } from './reelBend';
import { bendOf, createMotion, LEAD, type Motion, SETTLE_AFTER, stepMotion, TILT_LIMIT, tiltOf } from './reelMotion';
import { dampStep } from './reelPhase';

const FRAME = 1 / 60;
function run(motion: Motion, seconds: number, reduced = false): void {
  for (let frame = 0; frame < Math.round(seconds * 60); frame += 1) stepMotion(motion, FRAME, reduced);
}

describe('movimiento del reel', () => {
  it('la fase sigue al objetivo con la amortiguación de la especificación', () => {
    const motion = createMotion();
    motion.target = 1;
    stepMotion(motion, 0.016, false);
    expect(motion.phase).toBeCloseTo(dampStep(0, 1, 0.016), 12);
    run(motion, 1.5);
    expect(motion.phase).toBeCloseTo(1, 5);
  });

  it('el primer cuadro tras una pausa (dt = 0) coloca la fase sin animar', () => {
    const motion = createMotion();
    motion.target = 9;
    stepMotion(motion, 0, false);
    expect(motion.phase).toBe(9);
    expect(motion.speed).toBe(0);
  });

  it('sin entrada, asienta en el índice más cercano; mientras se arrastra, no', () => {
    const motion = createMotion();
    motion.target = 2.4;
    run(motion, SETTLE_AFTER - 0.05);
    expect(motion.target).toBe(2.4);
    run(motion, 0.1);
    expect(motion.target).toBe(2);
    Object.assign(motion, { target: 6.6, rest: 0, held: true });
    run(motion, 1);
    expect(motion.target).toBe(6.6);
  });

  it('el impulso de la rueda adelanta un poco la fase y se apaga solo', () => {
    const motion = createMotion();
    motion.impulse = 1;
    stepMotion(motion, FRAME, false);
    expect(motion.phase).toBeGreaterThan(0);
    expect(motion.phase).toBeLessThan(LEAD);
    expect(motion.impulse).toBeLessThan(1);
    run(motion, 4);
    expect(motion.impulse).toBeCloseTo(0, 4);
    expect(motion.phase).toBeCloseTo(0, 4);
  });

  it('con movimiento reducido responde al instante y nada se mueve solo', () => {
    const motion = createMotion();
    Object.assign(motion, { target: 5, impulse: 1 });
    stepMotion(motion, FRAME, true);
    expect([motion.phase, motion.impulse, motion.speed, motion.time]).toEqual([5, 0, 0, 0]);
    expect(bendOf(motion)).toBe(BEND_REST);
    expect(tiltOf(motion)).toBeCloseTo(0, 12);
  });

  it('el reloj de la ondulación avanza con cada cuadro y no con las pausas', () => {
    const motion = createMotion();
    stepMotion(motion, 0.016, false);
    stepMotion(motion, 0.016, false);
    stepMotion(motion, 0, false);
    expect(motion.time).toBeCloseTo(0.032, 12);
  });

  it('la rapidez curva más la tarjeta (hasta 0,42) e inclina un poco, con tope', () => {
    const motion = createMotion();
    expect(bendOf(motion)).toBe(BEND_REST);
    motion.target = 6;
    run(motion, 0.1);
    expect(motion.speed).toBeGreaterThan(0);
    expect(bendOf(motion)).toBeGreaterThan(BEND_REST);
    expect(bendOf(motion)).toBeLessThan(BEND_FAST + 1e-9);
    expect(tiltOf(motion)).toBeGreaterThan(0);
    motion.speed = -500;
    expect(tiltOf(motion)).toBe(-TILT_LIMIT);
    expect(bendOf(motion)).toBeCloseTo(BEND_FAST, 12);
  });
});
