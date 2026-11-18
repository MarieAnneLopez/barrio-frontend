import type { BuildOptions, BuildingSource, TileData } from './protocol';
import { writeRoof } from './roof';
import { capacityOf, createBuffers } from './tileBuffers';
import { volumeOf, type Volume } from './volume';
import { writeWalls } from './walls';

/** Caja del edificio (minX, minY, minZ, maxX, maxY, maxZ) a partir de su anillo exterior. */
function boxOf(s: BuildingSource, b: number, vol: Volume): number[] {
  const ring = s.edificios[b] ?? 0;
  let [x0, z0, x1, z1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (let v = s.anillos[ring] ?? 0; v < (s.anillos[ring + 1] ?? 0); v++) {
    const [x, z] = [s.xz[2 * v] ?? 0, s.xz[2 * v + 1] ?? 0];
    [x0, z0, x1, z1] = [Math.min(x0, x), Math.min(z0, z), Math.max(x1, x), Math.max(z1, z)];
  }
  return [x0, vol.bottom, z0, x1, vol.top, z1];
}

function unionOf(boxes: readonly number[]): Float32Array<ArrayBuffer> {
  const out = Float32Array.of(Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity);
  for (let i = 0; i < boxes.length; i += 6) {
    for (let k = 0; k < 3; k++) {
      out[k] = Math.min(out[k] ?? 0, boxes[i + k] ?? 0);
      out[k + 3] = Math.max(out[k + 3] ?? 0, boxes[i + k + 3] ?? 0);
    }
  }
  return out;
}

export interface TileWriter {
  /** Agrega el edificio `b` (techo primero y luego muros: su rango de índices queda contiguo). */
  add(b: number): void;
  finish(key: string): TileData;
}

/** Escritor de una tesela con los edificios `ids` (reserva sus arreglos de una vez). */
export function createTileWriter(s: BuildingSource, ids: readonly number[], o: BuildOptions, kinds: Uint8Array): TileWriter {
  let [vertices, indices] = [0, 0];
  for (const b of ids) {
    const c = capacityOf(s, b);
    [vertices, indices] = [vertices + c.vertices, indices + c.indices];
  }
  const t = createBuffers(vertices, indices);
  const placed: number[] = [];
  const ranges: number[] = [];
  const boxes: number[] = [];
  return {
    add(b) {
      const vol = volumeOf(s, b, o.levelHeight);
      if (!vol) return;
      placed.push(b);
      ranges.push(t.i);
      // El techo antes que los muros: tapa primero lo que el pretil no deja ver (menos sobredibujo).
      writeRoof(t, s, b, vol, o.parapet);
      writeWalls(t, s, b, vol, o.windowSpacing, kinds);
      boxes.push(...boxOf(s, b, vol));
    },
    finish(key) {
      const used = t.index.subarray(0, t.i);
      // Índices de 16 bits cuando caben: la mitad de memoria en la GPU.
      const index = t.v <= 65_536 ? new Uint16Array(used) : used.slice();
      return {
        key, index,
        position: t.position.slice(0, 3 * t.v), data: t.data.slice(0, 3 * t.v),
        buildings: Uint32Array.from(placed), ranges: Uint32Array.from([...ranges, t.i]),
        boxes: Float32Array.from(boxes), bounds: unionOf(boxes),
      };
    },
  };
}
