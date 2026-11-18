import { TNT3, type Tintal3D } from '../data/format';
import { groundKind, type GroundKind } from './groundAreas';
import type { Network } from './network';
import { footprints } from './footprints';
import { PolygonGrid } from './polygonGrid';
import { footSpec } from './roadClass';
import { SegmentIndex } from './segmentIndex';

// Dónde NO van los árboles DECORATIVOS (regla de dibujo, D105): sobre las canchas, juegos, pistas y
// agua de OSM, sobre calzadas y sus andenes, senderos y ciclorrutas (con TREE_GAP m de margen para el
// tronco) ni dentro de los edificios. Los árboles reales de OSM no pasan por aquí: son dato.

export const TREE_GAP = 1;
const HARD = new Set<GroundKind>(['cancha', 'juegos', 'pista', 'agua']);
const B = TNT3.banderasVia;

export function decorBlocker(world: Pick<Tintal3D, 'suelo' | 'vias' | 'edificios'>, net: Network): (x: number, z: number) => boolean {
  const { suelo: s, vias: v } = world;
  const hard = new PolygonGrid(s.xz, s.anillos, s.areas, s.count, (a) => HARD.has(groundKind(s.clase[a] ?? 0)));
  const ways = new SegmentIndex(v, (w) => {
    const spec = net.specs[w];
    if (spec) return spec.half + spec.sidewalk;
    const foot = footSpec(v.clase[w] ?? 0);
    return foot && !((v.banderas[w] ?? 0) & (B.tunel | B.area)) ? foot.width / 2 : 0;
  });
  const prints = footprints(world.edificios);
  return (x, z) => hard.contains(x, z) || ways.covering(x, z, TREE_GAP) !== null || prints.contains(x, z);
}
