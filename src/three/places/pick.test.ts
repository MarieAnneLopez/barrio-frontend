import { describe, expect, it } from 'vitest';
import { nearestMarker } from './pick';

// Pantalla de prueba: x e y del mundo son los píxeles; z < 0 queda detrás de la cámara.
const toScreen = (x: number, y: number, z: number): [number, number] | null => (z < 0 ? null : [x, y]);
const MARKERS = new Float32Array([100, 100, 0, 130, 100, 0, 400, 300, 0, 105, 102, -1]);

describe('elegir un marcador en pantalla (igual de fácil lejos o cerca)', () => {
  it('toma el más cercano al puntero dentro del radio, en píxeles', () => {
    expect(nearestMarker(MARKERS, toScreen, [118, 101], 18)).toBe(1);
    expect(nearestMarker(MARKERS, toScreen, [101, 99], 18)).toBe(0);
    expect(nearestMarker(MARKERS, toScreen, [395, 310], 18)).toBe(2);
  });

  it('fuera del radio no elige nada', () => {
    expect(nearestMarker(MARKERS, toScreen, [250, 200], 18)).toBe(-1);
  });

  it('ignora lo que queda detrás de la cámara', () => {
    expect(nearestMarker(new Float32Array([105, 102, -1]), toScreen, [105, 102], 18)).toBe(-1);
  });
});
