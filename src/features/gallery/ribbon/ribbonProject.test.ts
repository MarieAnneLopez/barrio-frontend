import { describe, expect, it } from 'vitest';
import { deform, layoutFor } from './ribbonGeometry';
import { cardZone, onScreen, project } from './ribbonProject';

const layout = layoutFor(1440, 836);

describe('proyección a la pantalla', () => {
  it('el origen cae en el centro del lienzo y (halfW, halfH, 0) en la esquina superior derecha', () => {
    expect(project([0, 0, 0], layout)).toEqual([720, 418]);
    const [x, y] = project([layout.halfW, layout.halfH, 0], layout);
    expect(x).toBeCloseTo(1440, 6);
    expect(y).toBeCloseTo(0, 6);
  });

  it('lo que se acerca a la cámara se ve más grande, y lo que se aleja, más pequeño', () => {
    const [near] = project([10, 0, 5], layout);
    const [flat] = project([10, 0, 0], layout);
    const [far] = project([10, 0, -5], layout);
    expect(near).toBeGreaterThan(flat);
    expect(far).toBeLessThan(flat);
  });
});

describe('zona de clic de una tarjeta, proyectada de la geometría deformada', () => {
  it('la tarjeta centrada cubre el centro del lienzo y mide lo que su plano curvado en pantalla', () => {
    const zone = cardZone(0, layout);
    expect(zone.left).toBeLessThan(720);
    expect(zone.left + zone.width).toBeGreaterThan(720);
    const nominal = layout.cardW / layout.unitsPerPixel;
    expect(zone.width / nominal).toBeGreaterThan(0.9);
    expect(zone.width / nominal).toBeLessThan(1.3);
    expect(onScreen(zone, layout)).toBe(true);
  });

  it('el polígono sigue los bordes superior e inferior ya curvados (18 vértices dentro de la caja)', () => {
    const zone = cardZone(layout.pitch, layout);
    const points = zone.points.split(', ').map((pair) => pair.split(' ').map((value) => Number.parseFloat(value)));
    expect(points).toHaveLength(18);
    for (const [x = -1, y = -1] of points) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(zone.width + 0.05);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(zone.height + 0.05);
    }
    const [, top] = project(deform(layout.pitch, layout.cardH / 2, layout.halfW), layout);
    expect(zone.top).toBeLessThanOrEqual(top);
  });

  it('una tarjeta lejos del centro queda fuera de la pantalla', () => {
    expect(onScreen(cardZone(3 * layout.halfW, layout), layout)).toBe(false);
    expect(onScreen(cardZone(-3 * layout.halfW, layout), layout)).toBe(false);
  });
});
