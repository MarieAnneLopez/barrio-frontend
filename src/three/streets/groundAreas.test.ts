import { Color } from 'three';
import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { makeSuelo } from './fixtures';
import { areaRings, GROUND_Y, groundKind, pushGround, triangulate } from './groundAreas';
import { Sink, type DayNight } from './sink';

const S = TNT3.clasesSuelo;
const square = (x0: number, z0: number, size: number, clockwise = false) => {
  const ring = [x0, z0, x0 + size, z0, x0 + size, z0 + size, x0, z0 + size];
  if (!clockwise) return ring;
  const out: number[] = [];
  for (let i = ring.length - 2; i >= 0; i -= 2) out.push(ring[i] ?? 0, ring[i + 1] ?? 0);
  return out;
};
const area = (xz: number[], index: number[]) => {
  let sum = 0;
  for (let t = 0; t < index.length; t += 3) {
    const [a, b, c] = [index[t] ?? 0, index[t + 1] ?? 0, index[t + 2] ?? 0];
    const [ax, az, bx, bz, cx, cz] = [xz[2 * a], xz[2 * a + 1], xz[2 * b], xz[2 * b + 1], xz[2 * c], xz[2 * c + 1]].map((v) => v ?? 0);
    sum += Math.abs(((bx ?? 0) - (ax ?? 0)) * ((cz ?? 0) - (az ?? 0)) - ((cx ?? 0) - (ax ?? 0)) * ((bz ?? 0) - (az ?? 0))) / 2;
  }
  return sum;
};

describe('áreas de suelo trianguladas con huecos', () => {
  it('un cuadrado de 100 m con un hueco de 40 m deja 8 400 m² y nada dentro del hueco', () => {
    const { xz, index } = triangulate([Float32Array.from(square(0, 0, 100)), Float32Array.from(square(30, 30, 40, true))]);
    expect(area(xz, index)).toBeCloseTo(8400, 3);
    // Ningún triángulo contiene el centro del hueco (50, 50).
    for (let t = 0; t < index.length; t += 3) {
      const c = [0, 1, 2].map((k) => index[t + k] ?? 0);
      const cx = c.reduce((s, v) => s + (xz[2 * v] ?? 0), 0) / 3;
      const cz = c.reduce((s, v) => s + (xz[2 * v + 1] ?? 0), 0) / 3;
      expect(cx > 30 && cx < 70 && cz > 30 && cz < 70).toBe(false);
    }
  });

  it('tolera anillos degenerados sin romper', () => {
    expect(triangulate([Float32Array.from([0, 0, 1, 1])]).index).toEqual([]);
  });

  it('agrupa las clases de OSM en pocas superficies, con el barrio abajo y el agua arriba', () => {
    expect(groundKind(S.barrio)).toBe('barrio');
    expect(groundKind(S.park)).toBe('verde');
    expect(groundKind(S.grass)).toBe('verde');
    expect(groundKind(S.pitch)).toBe('cancha');
    expect(groundKind(S.water)).toBe('agua');
    expect(GROUND_Y.barrio).toBe(0);
    expect(GROUND_Y.agua).toBeGreaterThan(GROUND_Y.verde);
  });

  it('todas las áreas van en una sola malla, con las caras hacia arriba y el color de su clase', () => {
    const suelo = makeSuelo([
      [S.barrio, [square(0, 0, 1000)]],
      [S.park, [square(100, 100, 200), square(150, 150, 50, true)]],
      [S.water, [square(500, 500, 100)]],
    ]);
    expect(areaRings(suelo, 1)).toHaveLength(2);
    const color = (v: number): DayNight => ({ day: new Color(v, v, v), night: new Color(0, 0, v) });
    const sink = new Sink();
    const triangles = pushGround(sink, suelo, { barrio: color(0.1), verde: color(0.2), cancha: color(0.3), juegos: color(0.4), pista: color(0.5), agua: color(0.6) });
    expect(triangles).toBe(sink.triangles);
    const g = sink.toGeometry();
    const p = g.getAttribute('position');
    const day = g.getAttribute('colorDay');
    const seen = new Set<string>();
    for (let i = 0; i < p.count; i++) seen.add(`${p.getY(i).toFixed(3)}:${day.getX(i).toFixed(1)}`);
    const y = (v: number) => v.toFixed(3);
    expect(seen).toEqual(new Set([`${y(0)}:0.1`, `${y(GROUND_Y.verde)}:0.2`, `${y(GROUND_Y.agua)}:0.6`]));
    g.computeVertexNormals();
    const n = g.getAttribute('normal');
    for (let i = 0; i < n.count; i++) expect(n.getY(i)).toBeGreaterThan(0.99);
  });
});
