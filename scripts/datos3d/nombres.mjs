// Nombre de conjunto o lugar para cada edificio, de OSM (Catastro no publica nombres): primero un
// edificio OSM con nombre que lo contenga; si no, el área con nombre más pequeña que lo contenga
// (conjunto residencial, colegio, parque…). Sin nombre, la ficha muestra la dirección.
import { bounds, signedArea } from './geo.mjs';
import { createGrid } from './grid.mjs';
import { pointInPolygon } from './inside.mjs';
import { osmPolygons, osmRef } from './osm.mjs';
import { SPEC } from './spec.mjs';

const AREA_KEYS = ['landuse', 'amenity', 'leisure', 'shop', 'office', 'tourism', 'healthcare', 'club'];
const SKIP_LANDUSE = new Set(['proposed', 'grass', 'meadow', 'forest']);
const K = SPEC.tipoNombre;

function namedPlaces(osm, project) {
  const places = [];
  for (const element of [...osm.ways, ...osm.relations]) {
    const tags = element.tags ?? {};
    const name = (tags.name ?? '').trim();
    if (!name) continue;
    const building = Boolean(tags.building) && tags.building !== 'no';
    const area = AREA_KEYS.some((k) => tags[k]) && !SKIP_LANDUSE.has(tags.landuse);
    if (!building && !area) continue;
    for (const rings of osmPolygons(element, project)) {
      places.push({ rings, area: Math.abs(signedArea(rings[0])), nombre: name, ref: osmRef(element), tipo: building ? K.edificio : K.area });
    }
  }
  return places;
}

/** Agrega tipoNombre, nombre y nombreRef (origen OSM) a cada edificio, por su punto interior. */
export function assignNames(items, osm, project) {
  const places = namedPlaces(osm, project);
  const grid = createGrid(100);
  places.forEach((place, i) => grid.insert(i, bounds(place.rings[0])));
  for (const item of items) {
    const hits = grid.around(item.punto, 0).map((i) => places[i]).filter((p) => pointInPolygon(item.punto, p.rings));
    hits.sort((a, b) => a.tipo - b.tipo || a.area - b.area || a.ref.localeCompare(b.ref));
    const best = hits[0];
    Object.assign(item, { tipoNombre: best?.tipo ?? K.ninguno, nombre: best?.nombre ?? '', nombreRef: best?.ref ?? '' });
  }
  return { lugares: places.length };
}
