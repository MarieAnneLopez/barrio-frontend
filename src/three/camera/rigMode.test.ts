import { TOUCH } from 'three';
import { describe, expect, it } from 'vitest';
import { MIN_CAMERA_Y } from './mapView';
import { MAP_REACH, MAX_POLAR_DEG, rigLimits } from './rigMode';

const RADIUS = 3200;

describe('límites de la cámara por modo', () => {
  it('Inicio (cine): órbita, un dedo desplaza la página y los topes de siempre', () => {
    const cine = rigLimits('cine', 2500, RADIUS);
    expect(cine).toMatchObject({ orbit: true, touchAction: 'pan-y', minDistance: 625, maxDistance: RADIUS * 4.5 });
    expect(cine.oneFinger).toBe(-1);
  });

  it('secciones con mapa: sin órbita, un dedo mueve el mapa y cabe el encuadre de mapa', () => {
    const mapa = rigLimits('mapa', 20_000, RADIUS);
    expect(mapa).toMatchObject({ orbit: false, touchAction: 'none', oneFinger: TOUCH.PAN });
    expect(mapa.maxDistance).toBeGreaterThanOrEqual(20_000);
    expect(rigLimits('mapa', 1000, RADIUS).maxDistance).toBe(RADIUS * 4.5);
  });

  it('el mapa nunca se aleja tanto que el plano cercano corte el cielo o el sol (6 radios)', () => {
    const { maxDistance } = rigLimits('mapa', 90_000, RADIUS);
    expect(maxDistance).toBe(RADIUS * MAP_REACH);
    expect(maxDistance * 0.5).toBeLessThan(RADIUS * 6);
  });

  it.each(['cine', 'mapa'] as const)('con lo más cerca y lo más inclinado, la cámara queda sobre 50 m (%s)', (mode) => {
    const { minDistance } = rigLimits(mode, 2500, RADIUS);
    expect(minDistance * Math.cos((MAX_POLAR_DEG * Math.PI) / 180)).toBeGreaterThanOrEqual(MIN_CAMERA_Y);
  });
});
