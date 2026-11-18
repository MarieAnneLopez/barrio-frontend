// Edificios de OSM que faltan en Catastro (solo esos se agregan). Uno «falta» si menos de un
// tercio de su huella cae sobre construcciones catastrales (muestreo en una rejilla de su caja).
import { bounds } from './geo.mjs';
import { createGrid } from './grid.mjs';
import { pointInPolygon, pointOnSurface } from './inside.mjs';
import { osmId, osmPolygons } from './osm.mjs';
import { cleanPolygon } from './rings.mjs';
import { SPEC } from './spec.mjs';

const F = SPEC.banderasEdificio;
const STEPS = 8;

function covered(rings, candidates) {
  const [x0, z0, x1, z1] = bounds(rings[0]);
  let inside = 0;
  let hits = 0;
  for (let i = 0; i < STEPS; i++) {
    for (let j = 0; j < STEPS; j++) {
      const p = [x0 + ((i + 0.5) * (x1 - x0)) / STEPS, z0 + ((j + 0.5) * (z1 - z0)) / STEPS];
      if (!pointInPolygon(p, rings)) continue;
      inside += 1;
      if (candidates.some((c) => pointInPolygon(p, c.rings))) hits += 1;
    }
  }
  return inside === 0 ? candidates.some((c) => pointInPolygon(pointOnSurface(rings), c.rings)) : hits / inside >= 1 / 3;
}

const levelsOf = (tags) => {
  const n = Number.parseInt(tags['building:levels'] ?? '', 10);
  return Number.isInteger(n) && n > 0 && n < 100 ? n : 0;
};

/** → { items, stats } con los edificios OSM del barrio sin construcción catastral debajo. */
export function osmComplement(osm, catastro, barrio, project) {
  const grid = createGrid(50);
  catastro.forEach((b, i) => grid.insert(i, bounds(b.rings[0])));
  const stats = { osm: 0, cubiertos: 0, agregados: 0 };
  const items = [];
  for (const element of [...osm.ways, ...osm.relations]) {
    const tags = element.tags ?? {};
    if (!tags.building || tags.building === 'no') continue;
    for (const raw of osmPolygons(element, project)) {
      const rings = cleanPolygon(raw);
      if (!rings) continue;
      const punto = pointOnSurface(rings);
      if (!barrio.inside(punto)) continue;
      stats.osm += 1;
      if (covered(rings, grid.query(bounds(rings[0])).map((i) => catastro[i]))) {
        stats.cubiertos += 1;
        continue;
      }
      const pisos = levelsOf(tags);
      const banderas = F.osm | (pisos ? F.pisosConocidos : 0) | (tags.building === 'construction' ? F.enConstruccion : 0);
      items.push({ rings, punto, pisos, base: 0, sotanos: 0, banderas, lote: '', osm: osmId(element) });
      stats.agregados += 1;
    }
  }
  return { items, stats };
}
