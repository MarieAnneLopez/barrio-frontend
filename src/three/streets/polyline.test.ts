import { describe, expect, it } from 'vitest';
import { cumulative, densify, locate, offsetPoint, rightNormals } from './polyline';

describe('polilíneas en el plano x-z', () => {
  // Hacia el este 10 m y luego hacia el sur 10 m (z crece hacia el sur).
  const corner = new Float32Array([0, 0, 10, 0, 10, 10]);

  it('largo acumulado por vértice', () => {
    expect(Array.from(cumulative(corner))).toEqual([0, 10, 20]);
  });

  it('la normal derecha de quien va al este apunta al sur, y al norte apunta al este', () => {
    const n = rightNormals(new Float32Array([0, 0, 10, 0]));
    expect(n[0]).toBeCloseTo(0);
    expect(n[1]).toBeCloseTo(1);
    const north = rightNormals(new Float32Array([0, 0, 0, -10]));
    expect(north[0]).toBeCloseTo(1);
    expect(north[1]).toBeCloseTo(0);
  });

  it('en una esquina la normal es la bisectriz alargada (inglete): la cinta mantiene su ancho', () => {
    const n = rightNormals(corner);
    // Esquina hacia la derecha: la bisectriz de (0, 1) y (−1, 0), de largo √2.
    expect(n[2]).toBeCloseTo(-1);
    expect(n[3]).toBeCloseTo(1);
  });

  it('un giro casi completo no dispara el inglete', () => {
    const n = rightNormals(new Float32Array([0, 0, 10, 0, 0, 0.1]));
    expect(Math.hypot(n[2] ?? 0, n[3] ?? 0)).toBeLessThanOrEqual(2.5 + 1e-6);
  });

  it('locate encuentra el tramo y la fracción para una distancia', () => {
    const cum = cumulative(corner);
    expect(locate(cum, 0, 3, 15)).toEqual([1, 0.5]);
    expect(locate(cum, 0, 3, -4)).toEqual([0, 0]);
    expect(locate(cum, 0, 3, 99)).toEqual([1, 1]);
  });

  it('offsetPoint desplaza a la derecha del sentido de avance', () => {
    const line = new Float32Array([0, 0, 10, 0]);
    const out = [0, 0];
    offsetPoint(line, rightNormals(line), cumulative(line), 0, 2, 5, 2, out);
    expect(out[0]).toBeCloseTo(5);
    expect(out[1]).toBeCloseTo(2);
  });

  it('densify inserta vértices en las distancias pedidas sin repetir los existentes', () => {
    const d = densify(new Float32Array([0, 0, 100, 0]), [30, 50, 100, 0, 70]);
    expect(Array.from(d.cum)).toEqual([0, 30, 50, 70, 100]);
    expect(Array.from(d.source)).toEqual([0, -1, -1, -1, 1]);
    expect(d.xz[2]).toBeCloseTo(30);
  });
});
