// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { QUALITY } from '../quality/qualityStore';
import { BASE_CARS, BASE_PEOPLE, vidaCounts } from './density';
import { activeFlights, FLIGHT_S, flightPose, flightStart, MAX_FLIGHTS, sightAnchor } from './flights';
import { turnCurve, bezierAt } from './turns';

describe('densidad de la vida según la calidad', () => {
  it('carros y personas escalan con QUALITY[level].density', () => {
    const [low, mid, high] = ([0, 1, 2] as const).map((level) => vidaCounts(QUALITY[level].density));
    expect(high).toEqual({ cars: BASE_CARS, people: BASE_PEOPLE });
    expect(mid?.cars).toBe(Math.round(BASE_CARS * QUALITY[1].density));
    expect(low?.people).toBe(Math.round(BASE_PEOPLE * QUALITY[0].density));
    expect((low?.cars ?? 0) < (mid?.cars ?? 0) && (mid?.cars ?? 0) < (high?.cars ?? 0)).toBe(true);
  });

  it('fuera de [0, 1] se recorta', () => {
    expect(vidaCounts(3)).toEqual(vidaCounts(1));
    expect(vidaCounts(-1)).toEqual({ cars: 0, people: 0 });
  });
});

describe('aviones cada 1–3 minutos', () => {
  it('el intervalo entre dos aviones seguidos está siempre en [60, 180] s y es determinista', () => {
    const gaps = Array.from({ length: 2000 }, (_, k) => flightStart(k + 1) - flightStart(k));
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(60);
    expect(Math.max(...gaps)).toBeLessThanOrEqual(180);
    expect(new Set(gaps.map((g) => g.toFixed(1))).size).toBeGreaterThan(100); // no es un reloj fijo
    expect(flightStart(77)).toBe(flightStart(77));
  });

  it('nunca hay más de MAX_FLIGHTS en el aire y cada uno vuela FLIGHT_S segundos', () => {
    const out: number[] = [];
    for (let t = 0; t < 20_000; t += 7) {
      const n = activeFlights(t, out);
      expect(n).toBeLessThanOrEqual(MAX_FLIGHTS);
      for (let i = 0; i < n; i++) {
        const k = out[i] ?? 0;
        expect(t).toBeGreaterThanOrEqual(flightStart(k));
        expect(t).toBeLessThan(flightStart(k) + FLIGHT_S);
      }
    }
  });

  it('cruzan alto sobre la isla de borde a borde y pasan por su punto, muy por encima de los edificios', () => {
    const pose = { x: 0, y: 0, z: 0, yaw: 0 };
    for (let k = 0; k < 50; k++) {
      let closest = Infinity;
      const ends: number[] = [];
      for (let p = 0; p <= 1.0001; p += 0.01) {
        flightPose(k, flightStart(k) + p * FLIGHT_S, [100, -50], 2000, pose);
        closest = Math.min(closest, Math.hypot(pose.x - 100, pose.z + 50));
        if (p === 0 || p > 0.999) ends.push(Math.hypot(pose.x - 100, pose.z + 50));
        expect(pose.y).toBeGreaterThanOrEqual(300);
        expect(pose.y).toBeLessThanOrEqual(380);
      }
      expect(closest).toBeLessThan(61);
      for (const end of ends) expect(end).toBeGreaterThan(2000); // empieza y termina fuera de la isla
    }
  });

  it('pasan por la línea de mira de la cámara a su altura, sin salirse de la isla', () => {
    const down = Math.SQRT1_2;
    expect(sightAnchor([0, 1000, 1000], [0, -down, -down], 300, [0, 0], 2000).map((v) => Math.round(v))).toEqual([0, 300]);
    expect(sightAnchor([0, 1000, 1000], [0, 0.2, -0.98], 300, [5, 7], 2000)).toEqual([5, 7]); // mira al cielo
    const far = sightAnchor([0, 1000, 9000], [0, -down, -down], 300, [0, 0], 2000);
    expect(Math.hypot(...far)).toBeCloseTo(1600, 3);
  });
});

describe('curva de giro', () => {
  it('sale de p0 en su dirección y llega a p2: giro a la derecha de 90°', () => {
    const curve = new Float32Array(6);
    const length = turnCurve(0, 0, 1, 0, 5, 5, 0, 1, curve, 0);
    expect(Array.from(curve)).toEqual([0, 0, 5, 0, 5, 5]); // control en el cruce de las dos rectas
    expect(length).toBeGreaterThan(Math.hypot(5, 5));
    const at = [0, 0, 0, 0];
    bezierAt(curve, 0, 0, at);
    expect([at[0], at[1], Math.sign(at[2] ?? 0), at[3]]).toEqual([0, 0, 1, 0]);
    bezierAt(curve, 0, 1, at);
    expect([at[0], at[1]]).toEqual([5, 5]);
  });
});
