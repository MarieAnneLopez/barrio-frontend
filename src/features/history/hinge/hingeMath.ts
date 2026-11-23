// STUB: firma congelada en .ai/CONTRACTS.md; `programador` implementa la matemática HINGE.
import type { HingePanelState } from './types';

export const HINGE_COLS = 4;
export const HINGE_ROWS = 3;

const FLAT: HingePanelState = { rotX: 0, rotY: 0, posZ: 0, outward: 0 };

// STUB: superficie siempre plana.
export const hingePanelState: (fraccion: number, col: number, row: number) => HingePanelState = () => ({ ...FLAT });
