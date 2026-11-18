import { describe, expect, it } from 'vitest';
import { createMotion, dragTarget, launchTarget, stepMotion, wheelPixels, wheelTarget } from './ribbonMotion';

describe('movimiento de la cinta', () => {
  it('cada cuadro acerca el desplazamiento al objetivo con 1 − e^(−7 dt)', () => {
    const motion = { ...createMotion(), target: 10 };
    expect(stepMotion(motion, 1 / 60, false)).toBe(true);
    expect(motion.current).toBeCloseTo(10 * (1 - Math.exp(-7 / 60)), 10);
  });

  it('dt se limita a 0,05 s: una pausa larga no da un salto', () => {
    const [slow, capped] = [{ ...createMotion(), target: 10 }, { ...createMotion(), target: 10 }];
    stepMotion(slow, 1, false);
    stepMotion(capped, 0.05, false);
    expect(slow.current).toBeCloseTo(capped.current, 10);
  });

  it('el primer cuadro tras una pausa (dt = 0) no mueve nada', () => {
    const motion = { ...createMotion(), target: 10 };
    expect(stepMotion(motion, 0, false)).toBe(true);
    expect(motion.current).toBe(0);
  });

  it('asienta exacto en el objetivo y entonces deja de pedir cuadros', () => {
    const motion = { ...createMotion(), target: 3 };
    let frames = 0;
    while (stepMotion(motion, 1 / 60, false)) frames += 1;
    expect(motion.current).toBe(3);
    expect(frames).toBeGreaterThan(30);
    expect(frames).toBeLessThan(120);
  });

  it('con movimiento reducido llega al instante', () => {
    const motion = { ...createMotion(), target: 42 };
    expect(stepMotion(motion, 1 / 60, true)).toBe(false);
    expect(motion.current).toBe(42);
  });
});

describe('entrada convertida en objetivo', () => {
  it('rueda: delta · 0,8 · unidades por píxel, en el eje dominante', () => {
    expect(wheelPixels(0, 120, 0)).toBe(120);
    expect(wheelPixels(-40, 10, 0)).toBe(-40);
    expect(wheelPixels(0, 3, 1)).toBe(48); // líneas de 16 px
    expect(wheelTarget(5, 100, 0.05)).toBeCloseTo(5 + 100 * 0.8 * 0.05, 10);
  });

  it('arrastre: el contenido sigue al dedo (a la izquierda avanza)', () => {
    expect(dragTarget(20, -100, 0.05)).toBeCloseTo(25, 10);
    expect(dragTarget(20, 40, 0.05)).toBeCloseTo(18, 10);
  });

  it('lanzamiento × 6 si el último movimiento fue hace menos de 100 ms', () => {
    expect(launchTarget(10, -12, 50, 0.05)).toBeCloseTo(10 + 12 * 6 * 0.05, 10);
    expect(launchTarget(10, -12, 100, 0.05)).toBe(10);
    expect(launchTarget(10, -12, 250, 0.05)).toBe(10);
  });
});
