// @vitest-environment node
// Recorte de líneas al polígono del barrio e índice espacial por celdas.
import { describe, expect, it } from 'vitest';
import { clipLine } from './clip.mjs';
import { createGrid } from './grid.mjs';

// Cuadrado de 100 m (x 0..100, z -100..0) con una muesca que entra desde el sur entre x 40 y 60.
const notched = [[[0, 0], [40, 0], [40, -50], [60, -50], [60, 0], [100, 0], [100, -100], [0, -100]]];

describe('clipLine', () => {
  it('una línea toda dentro queda igual y conserva el índice de cada vértice', () => {
    expect(clipLine([[10, -10], [20, -20], [30, -80]], notched)).toEqual([
      [[10, -10, 0], [20, -20, 1], [30, -80, 2]],
    ]);
  });

  it('una línea que sale se corta en el borde con un vértice nuevo (índice -1)', () => {
    expect(clipLine([[10, -10], [10, 20]], notched)).toEqual([[[10, -10, 0], [10, 0, -1]]]);
  });

  it('una línea que cruza la muesca sale en dos tramos', () => {
    const pieces = clipLine([[20, -20], [80, -20]], notched);
    expect(pieces).toEqual([
      [[20, -20, 0], [40, -20, -1]],
      [[60, -20, -1], [80, -20, 1]],
    ]);
  });

  it('una línea toda fuera desaparece', () => {
    expect(clipLine([[200, 0], [300, 10]], notched)).toEqual([]);
  });
});

describe('createGrid', () => {
  it('devuelve solo los elementos cuyas cajas tocan la consulta, sin repetir', () => {
    const grid = createGrid(10);
    grid.insert(1, [0, 0, 5, 5]);
    grid.insert(2, [0, 0, 35, 5]); // ocupa varias celdas
    grid.insert(3, [100, 100, 101, 101]);
    expect(grid.query([1, 1, 2, 2]).sort()).toEqual([1, 2]);
    expect(grid.query([30, 0, 31, 1])).toEqual([2]);
    expect(grid.query([50, 50, 60, 60])).toEqual([]);
  });

  it('busca alrededor de un punto con un radio', () => {
    const grid = createGrid(10);
    grid.insert('a', [0, 0, 0, 0]);
    grid.insert('b', [25, 0, 25, 0]);
    expect(grid.around([2, 0], 5)).toEqual(['a']);
    expect(grid.around([2, 0], 30).sort()).toEqual(['a', 'b']);
  });
});
