import { TNT3, type Suelo, type Vias } from '../data/format';
import { areaRings } from '../streets/groundAreas';
import { LEVEL } from '../streets/levels';
import { buildNetwork, clearance } from '../streets/network';
import { rightNormals } from '../streets/polyline';
import { footSpec } from '../streets/roadClass';
import { isBridge, wayLine } from '../streets/wayLine';
import { offsetSlice, packPaths, type PathDraft, type WalkPaths } from './pathPack';
import { strolls } from './strolls';

// Por dónde caminan las personitas: andenes, senderos, cruces y plazas de OSM (clases 20–27, sin
// ciclorrutas), el borde de las calzadas (andenes por regla: OSM mapea pocos aparte, FORMATO §4) y
// paseos dentro de parques, canchas y plazas (strolls.ts).

export type { WalkPaths } from './pathPack';

const C = TNT3.clasesVia;
const S = TNT3.clasesSuelo;
const PARKS = new Set<number>([S.park, S.garden, S.playground, S.recreation_ground, S.village_green, S.pitch]);
/** Margen (m) entre el final de un andén y la calzada de la calle que lo cruza. */
const CURB_GAP = 0.6;

function footways(v: Vias, d: PathDraft[]): void {
  for (let w = 0; w < v.count; w++) {
    const clase = v.clase[w] ?? 0;
    const foot = footSpec(clase);
    if (!foot || clase === C.cycleway || (v.banderas[w] ?? 0) & (TNT3.banderasVia.tunel | TNT3.banderasVia.area)) continue;
    const line = wayLine(v, w);
    const weight = clase === C.track || clase === C.path ? 0.5 : 1;
    d.push({ xz: Array.from(line.xz), y: Array.from(line.y, (h) => h + LEVEL.foot), weight, width: foot.width });
  }
}

/**
 * Los dos andenes de cada calle, partidos donde los corta una calle de igual o mayor rango (como se
 * dibujan): nadie camina por la calzada del cruce; las calles menores se cruzan de largo.
 */
function sidewalks(v: Vias, d: PathDraft[]): void {
  const net = buildNetwork(v);
  for (let w = 0; w < v.count; w++) {
    const spec = net.specs[w];
    if (!spec || spec.sidewalk <= 0 || isBridge(v, w)) continue;
    const line = wayLine(v, w);
    const cum = line.cum;
    const nrm = rightNormals(line.xz);
    const last = line.node.length - 1;
    const cut = (k: number) => {
      const node = line.node[k] ?? -1;
      const c = node >= 0 ? clearance(net, node, w) : 0;
      return c > 0 ? c + CURB_GAP : 0;
    };
    let start = cut(0);
    for (let k = 1; k <= last; k++) {
      const c = cut(k);
      if (k < last && c <= 0) continue;
      const end = (cum[k] ?? 0) - c;
      for (const side of [-1, 1]) {
        const xz = end - start > 3 ? offsetSlice(line.xz, cum, nrm, side * (spec.half + spec.sidewalk / 2), start, end) : [];
        d.push({ xz, y: new Array<number>(xz.length / 2).fill(LEVEL.sidewalk), weight: 0.6, width: spec.sidewalk });
      }
      start = (cum[k] ?? 0) + c;
    }
  }
}

export function buildWalkPaths(v: Vias, s: Suelo): WalkPaths {
  const d: PathDraft[] = [];
  footways(v, d);
  sidewalks(v, d);
  for (let a = 0; a < s.count; a++) if (PARKS.has(s.clase[a] ?? 0)) strolls(areaRings(s, a), a + 1, d);
  for (let w = 0; w < v.count; w++) {
    if (!((v.banderas[w] ?? 0) & TNT3.banderasVia.area) || !footSpec(v.clase[w] ?? 0)) continue;
    strolls([wayLine(v, w).xz], 9000 + w, d);
  }
  return packPaths(d);
}
