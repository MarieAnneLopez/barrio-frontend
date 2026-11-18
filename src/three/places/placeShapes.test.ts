import { describe, expect, it } from 'vitest';
import { shapeAt, shapeCollector, shapeOutline } from './placeShapes';

type Line = [number, number][];
interface Figure {
  id: number;
  area: boolean;
  lines: Line[];
}

/** Contorno de la capa (pares de extremos xyz, en orden) y el índice de sus figuras, como buildPlaceLayer. */
function build(figures: Figure[]) {
  const outline: number[] = [];
  const collector = shapeCollector();
  for (const { id, area, lines } of figures) {
    const before = outline.length;
    for (const line of lines) {
      for (let i = 1; i < line.length; i++) {
        const [x0, z0] = line[i - 1] ?? [0, 0];
        const [x1, z1] = line[i] ?? [0, 0];
        outline.push(x0, 0, z0, x1, 0, z1);
      }
    }
    collector.add(id, area, [0, 0, 0], (outline.length - before) / 6);
  }
  return { shapes: collector.done(), outline: new Float32Array(outline) };
}

const square = (x: number, z: number, side: number): Line =>
  [[x, z], [x + side, z], [x + side, z + side], [x, z + side], [x, z]];
const LOTS = build([
  { id: 5, area: true, lines: [square(0, 0, 10)] },
  { id: 6, area: true, lines: [square(10, 0, 10)] },
]);

describe('lotes y tramos que se eligen en el suelo (módulos densos en su sección)', () => {
  it('un lote se elige por dentro, y fuera de todos no se elige nada', () => {
    expect(shapeAt(LOTS.shapes, LOTS.outline, 5, 5, 2)).toBe(0);
    expect(shapeAt(LOTS.shapes, LOTS.outline, 15, 5, 2)).toBe(1);
    expect(shapeAt(LOTS.shapes, LOTS.outline, 25, 5, 2)).toBe(-1);
    expect(LOTS.shapes.ids).toEqual([5, 6]);
  });

  it('el hueco de un lote no es del lote (regla par-impar)', () => {
    const { shapes, outline } = build([{ id: 1, area: true, lines: [square(0, 0, 30), square(10, 10, 10)] }]);
    expect(shapeAt(shapes, outline, 5, 5, 2)).toBe(0);
    expect(shapeAt(shapes, outline, 15, 15, 2)).toBe(-1);
  });

  it('un tramo de calle se elige cerca de su trazo, hasta la tolerancia, y gana el más cercano', () => {
    const { shapes, outline } = build([
      { id: 7, area: false, lines: [[[0, 0], [100, 0]]] },
      { id: 8, area: false, lines: [[[0, 50], [100, 50]]] },
    ]);
    expect(shapeAt(shapes, outline, 50, 3, 5)).toBe(0);
    expect(shapeAt(shapes, outline, 50, 46, 5)).toBe(1);
    expect(shapeAt(shapes, outline, 50, 25, 5)).toBe(-1);
    expect(shapeAt(shapes, outline, 104, 0, 5)).toBe(0); // pasado el extremo cuenta la distancia al extremo
  });

  it('el resalte toma solo los segmentos de la figura elegida', () => {
    const own = shapeOutline(LOTS.shapes, LOTS.outline, 1);
    expect(own).toHaveLength(4 * 6);
    for (let i = 0; i < own.length; i += 3) expect(own[i]).toBeGreaterThanOrEqual(10);
    expect(shapeOutline(LOTS.shapes, LOTS.outline, 9)).toHaveLength(0);
  });
});
