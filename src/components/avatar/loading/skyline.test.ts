import { describe, expect, it } from 'vitest';
import { CLOUD_TILE, clouds, skyline, TILE } from './skyline';

const numbers = (path: string): number[] => [...path.matchAll(/-?\d+(\.\d+)?/g)].map((m) => Number(m[0]));
const xs = (path: string): number[] => [...path.matchAll(/M(-?\d+(?:\.\d+)?) /g)].map((m) => Number(m[1]));

describe('barrio de fondo de la carga', () => {
  it('es determinista: la misma semilla da el mismo barrio', () => {
    expect(skyline(7, 80, 220, true)).toEqual(skyline(7, 80, 220, true));
    expect(skyline(7, 80, 220, true)).not.toEqual(skyline(8, 80, 220, true));
  });

  it('ningún edificio sale de la tira: el bucle no tiene costura', () => {
    const { body, windows } = skyline(11, 120, 260, true);
    for (const x of [...xs(body), ...xs(windows)]) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(TILE.width);
    }
    for (const value of numbers(body)) expect(Math.abs(value)).toBeLessThanOrEqual(TILE.width);
  });

  it('la fila lejana no lleva ventanas; las nubes caben en su tira', () => {
    expect(skyline(3, 150, 280, false).windows).toBe('');
    for (const x of xs(clouds(5))) expect(x).toBeLessThan(CLOUD_TILE.width);
  });
});
