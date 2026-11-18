import { hash01 } from '../streets/hash';
import { insideRings } from '../streets/trees';
import type { PathDraft } from './pathPack';

// Paseos dentro de parques, canchas y plazas (regla de dibujo, no dato): rectas entre dos puntos de
// adentro del polígono, una por cada 2 500 m² (de 1 a 8), a ras del pasto.

export const STROLL_Y = 0.07;
const STROLL_WIDTH = 3;

export function strolls(rings: ArrayLike<number>[], seed: number, d: PathDraft[]): void {
  const outer = rings[0] ?? [];
  let [x0, z0, x1, z1, area] = [Infinity, Infinity, -Infinity, -Infinity, 0];
  for (let i = 0, j = outer.length / 2 - 1; i < outer.length / 2; j = i++) {
    const [xi, zi, xj, zj] = [outer[2 * i] ?? 0, outer[2 * i + 1] ?? 0, outer[2 * j] ?? 0, outer[2 * j + 1] ?? 0];
    [x0, x1, z0, z1] = [Math.min(x0, xi), Math.max(x1, xi), Math.min(z0, zi), Math.max(z1, zi)];
    area += (xj * zi - xi * zj) / 2;
  }
  const inside = (k: number): [number, number] | null => {
    for (let tries = 0; tries < 30; tries++) {
      const [x, z] = [x0 + (x1 - x0) * hash01(seed, k * 61 + tries), z0 + (z1 - z0) * hash01(k * 61 + tries, seed)];
      if (insideRings(rings, x, z)) return [x, z];
    }
    return null;
  };
  const count = Math.min(8, Math.max(1, Math.round(Math.abs(area) / 2500)));
  for (let k = 0; k < count; k++) {
    const [a, b] = [inside(2 * k), inside(2 * k + 1)];
    if (!a || !b || Math.hypot(a[0] - b[0], a[1] - b[1]) <= 4) continue;
    d.push({ xz: [...a, ...b], y: [STROLL_Y, STROLL_Y], weight: 1.3, width: STROLL_WIDTH });
  }
}
