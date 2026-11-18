import { describe, expect, it } from 'vitest';
import { layoutFor, normalAt } from './ribbonGeometry';
import { depthShade, diffuseLight, LABEL_MIN_LIGHT, LIGHT, SHADING } from './ribbonShading';

const { halfW } = layoutFor(1440, 836);

describe('sombreado analítico', () => {
  it('luz normalizada (−0,4, 0,5, 1), difusa 0,12 y brillo 48 / 0,35', () => {
    expect(Math.hypot(...LIGHT)).toBeCloseTo(1, 12);
    expect(LIGHT[0] / LIGHT[2]).toBeCloseTo(-0.4, 12);
    expect([SHADING.diffuse, SHADING.shininess, SHADING.specular]).toEqual([0.12, 48, 0.35]);
  });

  it('oscurece hacia el fondo con fuerza 0,8: nada delante del plano, todo a media halfW de hondo', () => {
    expect(depthShade(3, halfW)).toBe(1);
    expect(depthShade(0, halfW)).toBe(1);
    expect(depthShade(-0.25 * halfW, halfW)).toBeCloseTo(0.6, 12);
    expect(depthShade(-halfW, halfW)).toBeCloseTo(0.2, 12);
  });

  it('la difusa solo mueve el brillo entre 0,88 y 1', () => {
    expect(diffuseLight(LIGHT)).toBeCloseTo(1, 12);
    expect(diffuseLight([0, 0, -1])).toBeCloseTo(0.88, 12);
    for (const x of [-30, -10, 0, 15, 30]) {
      const light = diffuseLight(normalAt(x, 4, halfW));
      expect(light).toBeGreaterThanOrEqual(0.88);
      expect(light).toBeLessThanOrEqual(1);
    }
  });

  it('la etiqueta nunca recibe menos de 0,6 · 0,88 de brillo', () => {
    expect(LABEL_MIN_LIGHT).toBeCloseTo(0.528, 12);
  });
});
