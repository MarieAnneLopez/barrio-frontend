import { describe, expect, it } from 'vitest';
import { CYCLE_MS, DAWN_MS, DAY_MS, DUSK_MS, NIGHT_MS, skyAt, STILL_MS } from './cycle';

// Gran actualización: 5 min de día, atardecer lento, 5 min de noche, amanecer lento, con el reloj de pared.
const DUSK = DAY_MS;
const NIGHT = DAY_MS + DUSK_MS;
const DAWN = NIGHT + NIGHT_MS;

describe('ciclo de día y noche', () => {
  it('dura 5 min de día y 5 de noche, con transiciones lentas entre ellos', () => {
    expect([DAY_MS, NIGHT_MS]).toEqual([300_000, 300_000]);
    expect(DUSK_MS).toBeGreaterThanOrEqual(60_000);
    expect(DAWN_MS).toBeGreaterThanOrEqual(60_000);
    expect(CYCLE_MS).toBe(DAY_MS + DUSK_MS + NIGHT_MS + DAWN_MS);
  });

  it('recorre día, atardecer, noche y amanecer, y vuelve a empezar', () => {
    expect(skyAt(DAY_MS / 2)).toMatchObject({ phase: 'dia', night: 0 });
    expect(skyAt(DUSK + DUSK_MS / 2)).toMatchObject({ phase: 'atardecer', night: 0.5 });
    expect(skyAt(NIGHT + NIGHT_MS / 2)).toMatchObject({ phase: 'noche', night: 1 });
    expect(skyAt(DAWN + DAWN_MS / 2)).toMatchObject({ phase: 'amanecer', night: 0.5 });
    expect(skyAt(123_456 + 3 * CYCLE_MS)).toEqual(skyAt(123_456));
    expect(skyAt(-1000)).toEqual(skyAt(CYCLE_MS - 1000));
  });

  it('de día el sol está arriba y la luna abajo; de noche, al revés', () => {
    const noon = skyAt(DAY_MS / 2 - DAWN_MS / 2 + DUSK_MS / 2);
    expect(noon.sunElevation).toBeGreaterThan(1);
    expect(noon.moonElevation).toBeLessThan(0);
    const midnight = skyAt(NIGHT + NIGHT_MS / 2);
    expect(midnight.sunElevation).toBeLessThan(0);
    expect(midnight.moonElevation).toBeGreaterThan(1);
  });

  it('cambia sin saltos: segundo a segundo, la noche y el sol se mueven poco', () => {
    for (let ms = 0; ms < CYCLE_MS; ms += 1000) {
      const [a, b] = [skyAt(ms), skyAt(ms + 1000)];
      expect(Math.abs(b.night - a.night)).toBeLessThan(0.02);
      if (a.sunElevation > 0 && b.sunElevation > 0) expect(Math.abs(b.sunElevation - a.sunElevation)).toBeLessThan(0.01);
    }
  });

  it('con movimiento reducido queda quieto a plena luz', () => {
    expect(skyAt(STILL_MS)).toMatchObject({ phase: 'dia', night: 0 });
    expect(skyAt(STILL_MS).sunElevation).toBeGreaterThan(0.5);
  });
});
