import { describe, expect, it } from 'vitest';
import { cardPose, DEPTH_OFFSET, mod, PITCH, STEP_ANGLE, wrapRelative } from './reelMath';

const N = 14;
const track = { radius: 8, depth: 2.4, pitch: PITCH * 2 };

describe('índice envuelto', () => {
  it('relative queda en [−N/2, N/2)', () => {
    expect(wrapRelative(0, N)).toBe(0);
    expect(wrapRelative(6.99, N)).toBeCloseTo(6.99, 10);
    expect(wrapRelative(7, N)).toBe(-7);
    expect(wrapRelative(-7, N)).toBe(-7);
    expect(wrapRelative(-7.01, N)).toBeCloseTo(6.99, 10);
    expect(wrapRelative(13, N)).toBe(-1);
    expect(wrapRelative(-13, N)).toBe(1);
  });

  it('no cambia la tarjeta: solo le suma vueltas enteras', () => {
    for (let value = -40; value <= 40; value += 0.37) {
      const relative = wrapRelative(value, N);
      expect(relative).toBeGreaterThanOrEqual(-N / 2);
      expect(relative).toBeLessThan(N / 2);
      const turns = (value - relative) / N;
      expect(Math.abs(turns - Math.round(turns))).toBeLessThan(1e-9);
    }
  });

  it('mod devuelve siempre un resto positivo', () => {
    expect([mod(15, N), mod(-1, N), mod(-14, N), mod(0, N)].map(Math.abs)).toEqual([1, 13, 0, 0]);
  });
});

describe('postura en la pista', () => {
  it('constantes de la especificación', () => {
    expect([STEP_ANGLE, PITCH, DEPTH_OFFSET]).toEqual([0.73, 0.52, -0.28]);
  });

  it('la tarjeta central queda al frente y sin giro', () => {
    const pose = cardPose(0, track);
    expect(pose.x).toBeCloseTo(0, 12);
    expect(pose.y).toBeCloseTo(0, 12);
    expect(pose.z).toBeCloseTo(2.12, 12); // trackDepth − 0,28
    expect(pose.rotationY).toBeCloseTo(0, 12);
    expect(pose.rotationX).toBeCloseTo(0, 12);
  });

  it('theta = relative·0,73: posición en la elipse, altura por pitch y giro por la tangente', () => {
    const pose = cardPose(1, track);
    expect(pose.x).toBeCloseTo(5.33496, 4); // sin(0,73)·8
    expect(pose.y).toBeCloseTo(1.04, 12); // 1·pitch
    expect(pose.z).toBeCloseTo(1.50842, 4); // cos(0,73)·2,4 − 0,28
    expect(pose.rotationY).toBeCloseTo(Math.atan2(2.4 * Math.sin(0.73), 8 * Math.cos(0.73)), 12);
    expect(pose.rotationY).toBeCloseTo(0.26229, 4);
    expect(pose.rotationX).toBeCloseTo(-0.01, 12);
  });

  it('en una pista circular el giro es theta, y la pista es simétrica', () => {
    expect(cardPose(2, { radius: 3, depth: 3, pitch: 1 }).rotationY).toBeCloseTo(1.46, 12);
    const [right, left] = [cardPose(1.5, track), cardPose(-1.5, track)];
    expect(left.x).toBeCloseTo(-right.x, 12);
    expect(left.y).toBeCloseTo(-right.y, 12);
    expect(left.z).toBeCloseTo(right.z, 12);
    expect(left.rotationY).toBeCloseTo(-right.rotationY, 12);
  });

  it('las tarjetas del lado de atrás miran hacia atrás (se ocultan como caras traseras)', () => {
    expect(Math.abs(cardPose(3, track).rotationY)).toBeGreaterThan(Math.PI / 2);
    expect(cardPose(3, track).z).toBeLessThan(DEPTH_OFFSET);
  });

  it('rotateX = −0,01·relative más la inclinación por velocidad', () => {
    expect(cardPose(3, track, 0.05).rotationX).toBeCloseTo(0.02, 12);
    expect(cardPose(-2, track).rotationX).toBeCloseTo(0.02, 12);
  });
});
