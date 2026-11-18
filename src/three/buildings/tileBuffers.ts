import type { F32, U32 } from '../data/format';
import type { BuildingSource } from './protocol';

// Arreglos de una tesela en construcción. Se reservan de una vez con el tope exacto de vértices y
// el máximo de índices (earcut nunca da más de n + 2h − 2 triángulos), sin crecer ni copiar.

export interface TileBuffers {
  /** x, y, z por vértice. */
  position: F32;
  /** Por vértice: edificio, coordenada de columna de ventanas, y del remate del muro. */
  data: F32;
  index: U32;
  /** Vértices e índices escritos. */
  v: number;
  i: number;
}

export function createBuffers(vertices: number, indices: number): TileBuffers {
  return { position: new Float32Array(3 * vertices), data: new Float32Array(3 * vertices), index: new Uint32Array(indices), v: 0, i: 0 };
}

/** Escribe un vértice y devuelve su número. */
export function pushVertex(t: TileBuffers, x: number, y: number, z: number, building: number, column: number, top: number): number {
  const v = t.v++;
  t.position[3 * v] = x;
  t.position[3 * v + 1] = y;
  t.position[3 * v + 2] = z;
  t.data[3 * v] = building;
  t.data[3 * v + 1] = column;
  t.data[3 * v + 2] = top;
  return v;
}

export function pushTriangle(t: TileBuffers, a: number, b: number, c: number): void {
  if (t.i + 3 > t.index.length) return; // nunca pasa con el tope de capacityOf; se protege igual
  t.index[t.i++] = a;
  t.index[t.i++] = b;
  t.index[t.i++] = c;
}

/**
 * Tope de vértices e índices del edificio `b`: por anillo de n vértices, el muro lleva 2 (n + 1)
 * vértices (el primero se repite para cerrar las columnas) y 2n triángulos; el techo, n vértices
 * y a lo sumo n + 2h − 2 triángulos en total (h huecos).
 */
export function capacityOf(s: BuildingSource, b: number): { vertices: number; indices: number } {
  const [first, last] = [s.edificios[b] ?? 0, s.edificios[b + 1] ?? 0];
  let [vertices, indices, n] = [0, 0, 0];
  for (let r = first; r < last; r++) {
    const k = (s.anillos[r + 1] ?? 0) - (s.anillos[r] ?? 0);
    vertices += 2 * (k + 1) + k;
    indices += 6 * k;
    n += k;
  }
  indices += 3 * Math.max(0, n + 2 * Math.max(0, last - first - 1) - 2);
  return { vertices, indices };
}
