import type { HingePanelState } from './types';

export const HINGE_COLS = 4;
export const HINGE_ROWS = 3;

/** Perspectiva que encuadra justo las 3 filas: las piezas que avanzan en profundidad se ven más cerca. */
const FOV = 26;
const DISTANCE = HINGE_ROWS / 2 / Math.tan((FOV * Math.PI) / 360);
export const HINGE_CAMERA = { fov: FOV, near: 0.1, far: 40, position: [0, 0, DISTANCE] as [number, number, number] };

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
