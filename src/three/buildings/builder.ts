import { wallKinds } from './partyWalls';
import type { BuildOptions, BuildResult, BuildingSource, TileData } from './protocol';
import { drain, partitionSteps, TILE_SIZE, volumesOf } from './tiles';
import { createTileWriter } from './tileWriter';
import { LEVEL_HEIGHT, PARAPET } from './volume';
import { WINDOW_SPACING } from './windows';

// Constructor de las mallas de edificios, por teselas. Es un generador que cede el control tras
// cada edificio y, en los recorridos de todos (volúmenes, medianeras, reparto), cada pocos miles:
// el Web Worker lo corre de un tirón (buildAll) y el respaldo en el hilo principal lo avanza en
// tandas de pocos milisegundos por cuadro (useBuildingTiles).

export const DEFAULT_OPTIONS: BuildOptions = {
  tileSize: TILE_SIZE,
  levelHeight: LEVEL_HEIGHT,
  parapet: PARAPET,
  windowSpacing: WINDOW_SPACING,
};

const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now());

export function statsOf(tiles: readonly TileData[], ms: number): BuildResult['stats'] {
  let [buildings, vertices, triangles] = [0, 0, 0];
  for (const t of tiles) {
    buildings += t.buildings.length;
    vertices += t.position.length / 3;
    triangles += t.index.length / 3;
  }
  return { buildings, tiles: tiles.length, vertices, triangles, ms: Math.round(ms * 10) / 10 };
}

export function* buildTiles(source: BuildingSource, options: Partial<BuildOptions> = {}): Generator<void, BuildResult> {
  const o: BuildOptions = { ...DEFAULT_OPTIONS, ...options };
  const start = now();
  const volumes = yield* volumesOf(source, o.levelHeight);
  const kinds = yield* wallKinds(source, volumes);
  const plans = yield* partitionSteps(source, volumes, o.tileSize);
  const tiles: TileData[] = [];
  for (const plan of plans) {
    const writer = createTileWriter(source, plan.buildings, o, kinds);
    for (const b of plan.buildings) {
      writer.add(b);
      yield;
    }
    tiles.push(writer.finish(plan.key));
  }
  return { tiles, stats: statsOf(tiles, now() - start) };
}

/** Construye todo de una vez (Web Worker y pruebas). */
export function buildAll(source: BuildingSource, options: Partial<BuildOptions> = {}): BuildResult {
  return drain(buildTiles(source, options));
}
