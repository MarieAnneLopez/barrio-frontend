import { TNT3, type Vias } from '../data/format';
import type { SegmentIndex } from './segmentIndex';

// Cebras y cruces de ciclorruta en los cruces reales de OSM (TNT3.vias.cruces, FORMATO §4): con
// rotation.y = −ángulo el +x local va a lo largo de la calle; la franja mide `largo` en z (de andén a
// andén; si es 0, el ancho de la calzada más cercana) y las barras van a lo largo de x, repetidas en z.

export const ZEBRA = {
  /** Largo de cada barra a lo largo de la calle, ancho de barra y paso entre barras (m). */
  strip: 3.2,
  bar: 0.5,
  period: 1.05,
  /** Franja de la ciclorruta y sus cuadros blancos de borde. */
  cycleBand: 2.4,
  square: 0.4,
} as const;

/** Rectángulo plano: centro, ángulo del eje de la calle y medidas en x (a lo largo) y z (a lo ancho). */
export interface Mark { x: number; z: number; angle: number; sx: number; sz: number }

const T = TNT3.cruces;
const MARKS_MASK = 3;

export function crossingMarks(x: number, z: number, angle: number, length: number, tipo: number): { white: Mark[]; cycle: Mark[] } {
  const white: Mark[] = [];
  const cycle: Mark[] = [];
  if ((tipo & MARKS_MASK) === T.sinMarcas) return { white, cycle };
  const [ax, az] = [-Math.sin(angle), Math.cos(angle)]; // a lo ancho de la calle
  const [lx, lz] = [Math.cos(angle), Math.sin(angle)]; // a lo largo
  const at = (along: number, across: number): Mark => ({
    x: x + lx * along + ax * across, z: z + lz * along + az * across, angle, sx: 0, sz: 0,
  });
  if (tipo & T.ciclorruta) {
    cycle.push({ ...at(0, 0), sx: ZEBRA.cycleBand, sz: length });
    const n = Math.max(2, Math.floor(length / (2 * ZEBRA.square)));
    for (let k = 0; k < n; k++) {
      const across = (k - (n - 1) / 2) * 2 * ZEBRA.square;
      for (const side of [-1, 1]) white.push({ ...at((side * ZEBRA.cycleBand) / 2, across), sx: ZEBRA.square, sz: ZEBRA.square });
    }
    return { white, cycle };
  }
  const n = Math.max(2, Math.floor(length / ZEBRA.period));
  for (let k = 0; k < n; k++) white.push({ ...at(0, (k - (n - 1) / 2) * ZEBRA.period), sx: ZEBRA.strip, sz: ZEBRA.bar });
  return { white, cycle };
}

/** Todas las marcas de cruce del barrio. */
export function allCrossingMarks(v: Vias, roads: SegmentIndex): { white: Mark[]; cycle: Mark[] } {
  const out = { white: [] as Mark[], cycle: [] as Mark[] };
  const c = v.cruces;
  for (let i = 0; i < c.tipo.length; i++) {
    const [x, z] = [c.xz[2 * i] ?? 0, c.xz[2 * i + 1] ?? 0];
    const largo = c.largo[i] ?? 0;
    const length = largo > 0 ? largo : 2 * (roads.nearest(x, z, 15)?.half ?? 3.5);
    const marks = crossingMarks(x, z, c.angulo[i] ?? 0, length, c.tipo[i] ?? 0);
    out.white.push(...marks.white);
    out.cycle.push(...marks.cycle);
  }
  return out;
}
