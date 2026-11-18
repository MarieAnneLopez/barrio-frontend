// Suelo de la maqueta: el barrio, parques, pasto y agua (áreas OSM recortadas al barrio) y canales
// o quebradas (líneas recortadas al barrio). Árboles, hileras y faroles reales van en puntos.mjs.
import { clipPolygon } from './clipArea.mjs';
import { signedArea } from './geo.mjs';
import { osmId, osmPolygons, wayPoints } from './osm.mjs';
import { cleanPolygon } from './rings.mjs';
import { SPEC } from './spec.mjs';

const MIN_AREA_M2 = 1; // lo que queda del recorte por debajo de 1 m² es ruido del borde

const S = SPEC.clasesSuelo;
const W = SPEC.clasesAgua;
const KINDS = [
  ['leisure', ['park', 'garden', 'playground', 'pitch', 'track', 'sports_centre']],
  ['landuse', ['grass', 'recreation_ground', 'village_green', 'meadow', 'forest', 'basin']],
  ['natural', ['wood', 'scrub', 'grassland', 'water', 'wetland']],
  ['waterway', ['riverbank']],
];

export function areaClass(tags = {}) {
  for (const [key, values] of KINDS) if (values.includes(tags[key])) return S[tags[key]];
  return 0;
}

export function buildSuelo(osm, barrio, project, nombre) {
  const areas = barrio.polygons.map(cleanPolygon).filter(Boolean).map((rings) => ({ rings, clase: S.barrio, nombre, osm: 0 }));
  const stats = { areasFuera: 0, areasRecortadas: 0, areasSinRecortar: 0 };
  for (const element of [...osm.ways, ...osm.relations]) {
    const clase = areaClass(element.tags);
    if (!clase) continue;
    for (const raw of osmPolygons(element, project)) {
      const rings = cleanPolygon(raw);
      if (!rings) continue;
      const before = areas.length;
      for (const part of barrio.polygons) {
        const { polygons, recortada, fallo } = clipPolygon(rings, part);
        stats.areasRecortadas += recortada && polygons.length ? 1 : 0;
        stats.areasSinRecortar += fallo ? 1 : 0;
        for (const piece of polygons.map(cleanPolygon)) {
          if (piece && Math.abs(signedArea(piece[0])) >= MIN_AREA_M2) {
            areas.push({ rings: piece, clase, nombre: (element.tags.name ?? '').trim(), osm: osmId(element) });
          }
        }
      }
      if (areas.length === before) stats.areasFuera += 1;
    }
  }
  const lineas = [];
  for (const way of osm.ways) {
    const clase = W[way.tags?.waterway] ?? 0;
    if (!clase) continue;
    for (const piece of barrio.clip(wayPoints(way, project))) {
      lineas.push({ points: piece.map(([x, z]) => [x, z]), clase, nombre: (way.tags.name ?? '').trim(), osm: way.id });
    }
  }
  return { areas, lineas, stats };
}
