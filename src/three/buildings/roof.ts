import { Earcut } from 'three/src/extras/Earcut.js';
import type { BuildingSource } from './protocol';
import { pushTriangle, pushVertex, type TileBuffers } from './tileBuffers';
import type { Volume } from './volume';

/**
 * Techo plano del edificio `b`, triangulado con earcut (el de three: tolera los anillos que se tocan
 * en un punto o se cruzan, FORMATO §2) con sus huecos. Va `parapet` metros por debajo del remate del
 * muro: lo que asoma del muro por encima es el pretil (el shader pinta su cara de adentro). Cada
 * triángulo se orienta para que mire hacia arriba (antihorario en (x, −z)); los degenerados se omiten.
 */
export function writeRoof(t: TileBuffers, s: BuildingSource, b: number, vol: Volume, parapet: number): void {
  const [first, last] = [s.edificios[b] ?? 0, s.edificios[b + 1] ?? 0];
  const [from, to] = [s.anillos[first] ?? 0, s.anillos[last] ?? 0];
  if (to - from < 3) return;
  // Los anillos de un edificio son contiguos: sus vértices se pasan a earcut sin copiarlos.
  const flat = s.xz.subarray(2 * from, 2 * to) as unknown as number[];
  const holes: number[] = [];
  for (let r = first + 1; r < last; r++) holes.push((s.anillos[r] ?? 0) - from);
  const triangles = Earcut.triangulate(flat, holes, 2);
  const y = Math.max(vol.bottom + (vol.top - vol.bottom) / 2, vol.top - parapet);
  const base = t.v;
  for (let v = from; v < to; v++) pushVertex(t, s.xz[2 * v] ?? 0, y, s.xz[2 * v + 1] ?? 0, b, 0, vol.top);
  const x = (i: number) => flat[2 * i] ?? 0;
  const z = (i: number) => flat[2 * i + 1] ?? 0;
  for (let k = 0; k + 2 < triangles.length; k += 3) {
    const [a = 0, c1 = 0, c2 = 0] = [triangles[k], triangles[k + 1], triangles[k + 2]];
    // Producto cruz en (x, −z): > 0 si es antihorario visto desde arriba (normal hacia +y).
    const cross = (z(c1) - z(a)) * (x(c2) - x(a)) - (x(c1) - x(a)) * (z(c2) - z(a));
    if (cross === 0) continue;
    if (cross > 0) pushTriangle(t, base + a, base + c1, base + c2);
    else pushTriangle(t, base + a, base + c2, base + c1);
  }
}
