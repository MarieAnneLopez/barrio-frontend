import { describe, expect, it } from 'vitest';
import { CAMERA, CARD, deform, HALF_H, layoutFor, normalAt, surfaceAt } from './ribbonGeometry';

const TAN = Math.tan((53.4 * Math.PI) / 360);
const D = (halfW: number) => 0.2 * halfW;
/** Derivada numérica centrada. */
const numeric = (f: (x: number) => number, x: number, h = 1e-4) => (f(x + h) - f(x - h)) / (2 * h);

describe('cámara y mundo visible', () => {
  it('FOV 53,4, cámara en z 41,18, near 0,1 y far 2000; halfH = tan(FOV/2) · z', () => {
    expect(CAMERA).toEqual({ fov: 53.4, z: 41.18, near: 0.1, far: 2000 });
    expect(HALF_H).toBeCloseTo(TAN * 41.18, 10);
    expect(layoutFor(1440, 836).halfW).toBeCloseTo(HALF_H * (1440 / 836), 10);
  });

  it('plano de 64 × 40 segmentos, alto del 52 % y 20 px de separación en unidades del mundo', () => {
    expect([CARD.segmentsX, CARD.segmentsY]).toEqual([64, 40]);
    const layout = layoutFor(1440, 836);
    const unitsPerPixel = (2 * HALF_H) / 836;
    expect(layout.unitsPerPixel).toBeCloseTo(unitsPerPixel, 10);
    expect(layout.cardH).toBeCloseTo(0.52 * 2 * HALF_H, 10);
    expect(layout.cardW).toBeCloseTo(layout.cardH * CARD.aspect, 10);
    expect(layout.gap).toBeCloseTo(20 * unitsPerPixel, 10);
    expect(layout.pitch).toBeCloseTo(layout.cardW + layout.gap, 10);
  });

  it('en móvil el ancho no pasa del 88 % del mundo visible', () => {
    const layout = layoutFor(390, 640);
    expect(layout.cardW).toBeCloseTo(0.88 * 2 * layout.halfW, 10);
    expect(layout.cardH).toBeCloseTo(0.52 * 2 * HALF_H, 10);
  });
});

describe('superficie de la cinta', () => {
  const halfW = layoutFor(1440, 836).halfW;

  it('en el centro: z = −D · sin(π q) · e^(−q²) con q = −0,2, sin bisagra', () => {
    const q = -0.2;
    const shape = Math.sin(Math.PI * q) * Math.exp(-q * q);
    const slope = (Math.PI * Math.cos(Math.PI * q) - 2 * q * Math.sin(Math.PI * q)) * Math.exp(-q * q);
    expect(surfaceAt(0, halfW).z).toBeCloseTo(-D(halfW) * shape, 10);
    expect(surfaceAt(0, halfW).bank).toBeCloseTo((-0.16 * slope) / Math.PI, 10);
  });

  it('la bisagra suma −0,12 · halfW · s · (1,5 − 0,5 s²) con s limitado a [−1, 1]', () => {
    const profile = (x: number) => {
      const q = (x / halfW) * 1.15 - 0.2;
      return -D(halfW) * Math.sin(Math.PI * q) * Math.exp(-q * q);
    };
    for (const [x, s] of [[halfW, 1], [-halfW / 2, -0.5], [3 * halfW, 1], [-2 * halfW, -1]] as const) {
      expect(surfaceAt(x, halfW).z - profile(x)).toBeCloseTo(-0.12 * halfW * s * (1.5 - 0.5 * s * s), 8);
    }
  });

  it.each([-1.4, -0.7, -0.26, 0, 0.3, 0.61, 0.95, 1.3])('pendientes analíticas = numéricas en x = %f · halfW', (share) => {
    const x = share * halfW;
    const surface = surfaceAt(x, halfW);
    expect(surface.zSlope).toBeCloseTo(numeric((at) => surfaceAt(at, halfW).z, x), 6);
    expect(surface.bankSlope).toBeCloseTo(numeric((at) => surfaceAt(at, halfW).bank, x), 6);
  });

  it('deform: el peralte gira (y, z) sobre el eje x; x no cambia y no hay onda en y', () => {
    const { z, bank } = surfaceAt(5, halfW);
    expect(deform(5, 3, halfW)).toEqual([5, 3 * Math.cos(bank), 3 * Math.sin(bank) + z]);
    expect(deform(5, 0, halfW)).toEqual([5, 0, z]);
  });

  it.each([[-20, 8], [0, -9], [12, 10], [30, 0]])('la normal analítica es la del producto cruz en (%f, %f)', (x, y) => {
    const px = [0, 1, 2].map((axis) => numeric((at) => deform(at, y, halfW)[axis] ?? 0, x));
    const py = [0, 1, 2].map((axis) => numeric((at) => deform(x, at, halfW)[axis] ?? 0, y));
    const [ax = 0, ay = 0, az = 0] = px;
    const [bx = 0, by = 0, bz = 0] = py;
    const cross = [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
    const length = Math.hypot(...cross);
    const normal = normalAt(x, y, halfW);
    cross.forEach((value, axis) => expect(normal[axis]).toBeCloseTo(value / length, 5));
    expect(normal[2]).toBeGreaterThan(0); // mira a la cámara
  });
});
