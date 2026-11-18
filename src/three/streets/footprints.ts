import { TNT3, type Edificios } from '../data/format';
import { PolygonGrid } from './polygonGrid';

// Huellas de los edificios reales (Catastro y OSM) para que lo decorativo y lo que se mueve no las
// atraviese: árboles de los parques (treeGround) y caminos de las personitas (vida/walkPaths).

const cache = new WeakMap<Edificios, PolygonGrid>();

/** Huellas de los edificios que asoman (sin los subterráneos), una sola rejilla por juego de datos. */
export function footprints(e: Edificios): PolygonGrid {
  const hit = cache.get(e);
  if (hit) return hit;
  const below = TNT3.banderasEdificio.subterranea;
  const grid = new PolygonGrid(e.xz, e.anillos, e.edificios, e.count, (b) => ((e.banderas[b] ?? 0) & below) === 0);
  cache.set(e, grid);
  return grid;
}
