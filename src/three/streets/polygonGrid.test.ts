import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { makeEdificios } from './fixtures';
import { footprints } from './footprints';
import { PolygonGrid } from './polygonGrid';

const rect = (x0: number, z0: number, x1: number, z1: number) => [x0, z0, x1, z0, x1, z1, x0, z1];

describe('rejilla de polígonos con huecos', () => {
  // Un patio (hueco) en el primero; el segundo, lejos; el tercero queda fuera por `keep`.
  const e = makeEdificios([[rect(0, 0, 100, 100), rect(40, 40, 60, 60)], [[500, 500, 540, 500, 520, 530]], [rect(200, 0, 220, 20)]]);
  const grid = new PolygonGrid(e.xz, e.anillos, e.edificios, e.count, (p) => p !== 2);

  it('dice en qué polígono cae un punto (par-impar: el hueco no cuenta)', () => {
    expect(grid.find(10, 10)).toBe(0);
    expect(grid.find(50, 50)).toBe(-1);
    expect(grid.find(520, 510)).toBe(1);
    expect(grid.find(530, 525)).toBe(-1);
    expect(grid.contains(150, 150)).toBe(false);
  });

  it('`keep` deja polígonos fuera de la rejilla y `accept` filtra en cada consulta', () => {
    expect(grid.find(210, 10)).toBe(-1);
    expect(grid.contains(10, 10, (p) => p !== 0)).toBe(false);
    expect(grid.contains(520, 510, (p) => p === 1)).toBe(true);
  });

  it('dice dónde cruza un segmento los bordes, también los del hueco, una vez cada uno', () => {
    const cuts: number[] = [];
    grid.crossings(-20, 50, 120, 50, cuts); // 140 m que pasan por cuatro celdas del primero
    expect(cuts).toHaveLength(4);
    cuts.sort((a, b) => a - b).forEach((t, k) => expect(-20 + 140 * t).toBeCloseTo([0, 40, 60, 100][k] ?? NaN, 4));
    const more: number[] = [];
    grid.crossings(10, 10, 10, -10, more);
    grid.crossings(300, 300, 400, 400, more);
    grid.crossings(210, -5, 210, 30, more); // el tercero no está en la rejilla
    expect(more).toEqual([0.5]);
    grid.crossings(10, 10, 10, -10, more, (p) => p !== 0);
    expect(more).toEqual([0.5]);
  });

  it('huellas de los edificios: sin los subterráneos y una sola rejilla por juego de datos', () => {
    const b = makeEdificios([[rect(0, 0, 10, 10)], [rect(20, 0, 30, 10)]], [], [0, TNT3.banderasEdificio.subterranea]);
    expect(footprints(b).contains(5, 5)).toBe(true);
    expect(footprints(b).contains(25, 5)).toBe(false);
    expect(footprints(b)).toBe(footprints(b));
  });
});
