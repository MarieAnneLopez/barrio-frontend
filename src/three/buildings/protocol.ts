import type { Edificios, F32, U32 } from '../data/format';

// Contrato entre la escena y el constructor de edificios (Web Worker propio o, de respaldo, tandas
// en el hilo principal). Los arreglos de la tesela viajan transfiriendo sus buffers, sin copiarlos.

export type U16 = Uint16Array<ArrayBuffer>;

/** Lo que el constructor necesita de los datos TNT3 (al worker viaja una copia: la app no los pierde). */
export type BuildingSource = Pick<Edificios, 'count' | 'xz' | 'anillos' | 'edificios' | 'pisos' | 'base' | 'banderas'>;

export interface BuildOptions {
  /** Lado de las teselas (m): una malla por tesela para recortar por frustum y elegir rápido. */
  tileSize: number;
  /** Altura dibujada de un piso (m). */
  levelHeight: number;
  /** El techo queda este tanto por debajo del remate del muro (pretil, m dibujados). */
  parapet: number;
  /** Separación entre columnas de ventanas (m reales). */
  windowSpacing: number;
}

/** Una tesela: los edificios fusionados en una geometría indexada, lista para BufferGeometry. */
export interface TileData {
  key: string;
  /** x, y, z por vértice (m). */
  position: F32;
  /** Por vértice: índice del edificio, coordenada de columna de ventanas, y del remate del muro. */
  data: F32;
  index: U16 | U32;
  /** Edificios de la tesela en el orden de sus triángulos. */
  buildings: U32;
  /** Primer índice (en `index`) de cada edificio; el último valor es index.length. */
  ranges: U32;
  /** Caja de cada edificio: minX, minY, minZ, maxX, maxY, maxZ. */
  boxes: F32;
  /** Caja de la tesela (6 valores, mismo orden). */
  bounds: F32;
}

export interface BuildStats {
  buildings: number;
  tiles: number;
  vertices: number;
  triangles: number;
  /** Tiempo de construcción (ms) medido donde se construyó. */
  ms: number;
}

export interface BuildResult {
  tiles: TileData[];
  stats: BuildStats;
}

export interface BuildRequest {
  id: number;
  source: BuildingSource;
  options?: Partial<BuildOptions>;
}

export type BuildReply = { id: number; ok: true; result: BuildResult } | { id: number; ok: false; error: string };

/** Las columnas que usa el constructor (al pasarlas al worker se copian). */
export function sourceOf(e: Edificios): BuildingSource {
  const { count, xz, anillos, edificios, pisos, base, banderas } = e;
  return { count, xz, anillos, edificios, pisos, base, banderas };
}

/** Buffers de todas las teselas, para transferirlos en postMessage. */
export function transferablesOf(result: BuildResult): ArrayBuffer[] {
  return result.tiles.flatMap((t) => [t.position, t.data, t.index, t.buildings, t.ranges, t.boxes, t.bounds].map((a) => a.buffer));
}

const isTile = (t: unknown): t is TileData => {
  const tile = t as Partial<TileData> | null;
  return !!tile && typeof tile.key === 'string' && tile.position instanceof Float32Array && tile.data instanceof Float32Array
    && (tile.index instanceof Uint16Array || tile.index instanceof Uint32Array) && tile.ranges instanceof Uint32Array
    && tile.buildings instanceof Uint32Array && tile.boxes instanceof Float32Array && tile.bounds instanceof Float32Array;
};

/** Valida la forma de la respuesta del worker (un mensaje roto no debe tumbar la escena). */
export function isBuildReply(value: unknown): value is BuildReply {
  if (typeof value !== 'object' || value === null) return false;
  const { id, ok, result, error } = value as { id?: unknown; ok?: unknown; result?: Partial<BuildResult>; error?: unknown };
  if (typeof id !== 'number') return false;
  if (ok === false) return typeof error === 'string';
  return ok === true && Array.isArray(result?.tiles) && result.tiles.every(isTile) && typeof result.stats?.ms === 'number';
}
