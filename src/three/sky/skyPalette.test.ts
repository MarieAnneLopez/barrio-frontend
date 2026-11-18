import { Color, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { CYCLE_MS, DAY_MS, DUSK_MS, NIGHT_MS, skyAt } from './cycle';
import { createSkyMix, lightDirection, mixSky, sunLeads, type SkyPalette } from './skyPalette';

// Paleta fija para la prueba (en jsdom no hay CSS: los tokens se leen en el navegador).
const c = (hex: string) => new Color(hex);
const P: SkyPalette = {
  dayZenith: c('#8ecae6'), dayHorizon: c('#fcf0cf'), duskZenith: c('#6b6f9e'), duskHorizon: c('#f6a7c1'),
  nightZenith: c('#1a273a'), nightHorizon: c('#1f3a5f'), sunLight: c('#fff3dc'), moonLight: c('#8fa8d0'),
  dayAmbient: c('#b9c7d6'), nightAmbient: c('#2a3d5c'),
};
const noon = skyAt((DAY_MS - DUSK_MS) / 2 + DUSK_MS / 2 - 45_000 + 45_000);
const midnight = skyAt(DAY_MS + DUSK_MS + NIGHT_MS / 2);
const duskMid = skyAt(DAY_MS + DUSK_MS / 2);

describe('cielo y luz del ciclo (D106)', () => {
  it('a mediodía el cielo es el de día y la luz es la del sol', () => {
    const mix = mixSky(noon, P, createSkyMix());
    expect(mix.zenith.getHexString()).toBe('8ecae6');
    expect(mix.horizon.getHexString()).toBe('fcf0cf');
    expect(sunLeads(noon)).toBe(true);
    expect(mix.light.r).toBeGreaterThan(0.9);
  });

  it('a medianoche el cielo es el de la referencia y alumbra la luna, más tenue', () => {
    const mix = mixSky(midnight, P, createSkyMix());
    expect(mix.zenith.getHexString()).toBe('1a273a');
    expect(sunLeads(midnight)).toBe(false);
    expect(mix.light.b).toBeLessThan(0.5);
    expect(mix.light.b).toBeGreaterThan(mix.light.r);
  });

  it('el atardecer pinta el horizonte de rosa en su punto medio', () => {
    const mix = mixSky(duskMid, P, createSkyMix());
    expect(mix.dusk).toBeCloseTo(1, 5);
    expect(mix.horizon.r).toBeGreaterThan(mix.horizon.b);
  });

  it('la luz siempre viene de arriba y es unitaria, a cualquier hora', () => {
    const dir = new Vector3();
    for (let ms = 0; ms < CYCLE_MS; ms += 7_000) {
      lightDirection(skyAt(ms), dir);
      expect(dir.length()).toBeCloseTo(1, 5);
      expect(dir.y).toBeGreaterThan(0.1);
    }
  });
});
