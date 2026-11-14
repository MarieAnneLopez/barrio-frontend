// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { labelComponents } from './components.mjs';
import { groupPoses } from './poses.mjs';

function maskFrom(rows) {
  const H = rows.length;
  const W = rows[0].length;
  const mask = new Uint8Array(W * H);
  rows.forEach((row, y) => [...row].forEach((c, x) => (mask[y * W + x] = c === '#' ? 1 : 0)));
  return { mask, W, H };
}

describe('labelComponents', () => {
  it('etiqueta con conectividad 4 (las diagonales no se unen)', () => {
    const { mask, W, H } = maskFrom(['#..#', '.#..', '...#']);
    const { comps } = labelComponents(mask, W, H);
    expect(comps).toHaveLength(4);
  });

  it('calcula área y caja de cada componente', () => {
    const { mask, W, H } = maskFrom(['##..', '##..', '...#']);
    const { comps } = labelComponents(mask, W, H);
    const big = comps.find((c) => c.area === 4);
    expect(big).toMatchObject({ minX: 0, maxX: 1, minY: 0, maxY: 1 });
  });
});

describe('groupPoses', () => {
  const comp = (id, area, minX, maxX, minY = 0, maxY = 10) => ({ id, area, minX, maxX, minY, maxY });

  it('toma las N semillas mayores, ordena de izquierda a derecha y agrega piezas', () => {
    const comps = [
      comp(1, 500, 60, 90),
      comp(2, 600, 0, 30),
      comp(3, 40, 92, 95), // pieza suelta junto a la semilla 1
      comp(4, 3, 200, 201), // ruido: se descarta
    ];
    const poses = groupPoses(comps, 2, { minPieceArea: 10 });
    expect(poses.map((p) => p.ids)).toEqual([[2], [1, 3]]);
    expect(poses[1]).toMatchObject({ minX: 60, maxX: 95 });
  });

  it('falla si no hay suficientes semillas', () => {
    expect(() => groupPoses([comp(1, 500, 0, 9)], 2)).toThrow(/2 poses/);
  });
});
