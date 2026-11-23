import { describe, expect, it } from 'vitest';
import { HINGE_COLS, HINGE_ROWS, hingePanelState } from '../hinge/hingeMath';

const flat = (state: ReturnType<typeof hingePanelState>) => {
  expect(state.rotX).toBeCloseTo(0, 5);
  expect(state.rotY).toBeCloseTo(0, 5);
  expect(state.posZ).toBeCloseTo(0, 5);
  expect(state.outward).toBeCloseTo(0, 5);
};

const anchors = [
  [0.5, 0, 0, 2.614911, -0.060320, 0.326734, 0.060320],
  [0.5, 1, 1, 1.828932, 0, 0.744488, 0.116024],
  [0.5, 3, 2, 0.526682, 0.060320, 0.447374, 0.060320],
  [0.25, 0, 0, 0.971990, -0.099121, 0.536906, 0.099121],
  [0.25, 3, 2, 0, 0, 0, 0],
  [0.75, 3, 2, 2.169603, 0.099121, 0.735148, 0.099121],
  [0.75, 0, 0, Math.PI, 0, 0, 0],
] as const;

describe('hingePanelState', () => {
  it('es plano al principio y al final para sus doce paneles', () => {
    for (let col = 0; col < HINGE_COLS; col += 1) for (let row = 0; row < HINGE_ROWS; row += 1) {
      flat(hingePanelState(0, col, row));
      const end = hingePanelState(1, col, row);
      expect(end.rotY).toBeCloseTo(Math.PI, 5);
      expect(end.rotX).toBeCloseTo(0, 5);
      expect(end.posZ).toBeCloseTo(0, 5);
      expect(end.outward).toBeCloseTo(0, 5);
    }
  });

  it.each(anchors)('calcula el ancla f=%s, col=%s, row=%s', (f, col, row, rotY, rotX, posZ, outward) => {
    const actual = hingePanelState(f, col, row);
    expect(actual.rotY).toBeCloseTo(rotY, 5);
    expect(actual.rotX).toBeCloseTo(rotX, 5);
    expect(actual.posZ).toBeCloseTo(posZ, 5);
    expect(actual.outward).toBeCloseTo(outward, 5);
  });

  it('abre cada panel sin retroceder y conserva la fila central plana en X', () => {
    for (let col = 0; col < HINGE_COLS; col += 1) for (let row = 0; row < HINGE_ROWS; row += 1) {
      let prior = 0;
      for (let step = 0; step <= 20; step += 1) {
        const state = hingePanelState(step / 20, col, row);
        expect(state.rotY).toBeGreaterThanOrEqual(prior);
        if (row === 1) expect(state.rotX).toBeCloseTo(0, 5);
        prior = state.rotY;
      }
    }
    const firstEnd = 1 / 1.48;
    const lastStart = 0.48 / 1.48;
    expect(firstEnd).toBeCloseTo(0.675676, 5);
    expect(hingePanelState(firstEnd, 0, 0).rotY).toBeCloseTo(Math.PI, 5);
    expect(lastStart).toBeCloseTo(0.324324, 5);
    expect(hingePanelState(lastStart, 3, 2).rotY).toBeCloseTo(0, 5);
    expect(hingePanelState(lastStart + 0.01, 3, 2).rotY).toBeGreaterThan(0);
  });
});
