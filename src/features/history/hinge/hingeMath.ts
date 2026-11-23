import type { HingePanelState } from './types';

export const HINGE_COLS = 4;
export const HINGE_ROWS = 3;

export function hingePanelState(fraccion: number, col: number, row: number): HingePanelState {
  const delay = col * 0.11 + row * 0.075;
  const local = Math.max(0, Math.min(1, fraccion * 1.48 - delay));
  const smooth = local * local * (3 - 2 * local);
  const arc = smooth === 1 ? 0 : Math.sin(Math.PI * smooth);
  return {
    rotY: Math.PI * smooth,
    rotX: arc * (row - 1) * 0.12,
    posZ: arc * (0.65 + row * 0.12),
    outward: arc * 0.12,
  };
}
