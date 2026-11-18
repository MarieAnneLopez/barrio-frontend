// Árboles (natural=tree), hileras de árboles (natural=tree_row, recortadas) y faroles
// (highway=street_lamp) reales de OSM. Si la fuente no los tiene, quedan vacíos: no se inventan.
import { osmPolygons, wayPoints } from './osm.mjs';

export function buildPuntos(osm, barrio, project) {
  const nodes = (key, value) => osm.nodes
    .filter((n) => n.tags?.[key] === value)
    .map((n) => ({ p: project([n.lon, n.lat]), osm: n.id }))
    .filter(({ p }) => barrio.inside(p));
  const hileras = [];
  for (const way of osm.ways) {
    if (way.tags?.natural !== 'tree_row') continue;
    // Una hilera cerrada (rodea algo) se recorre completa, volviendo al primer árbol.
    const ring = osmPolygons(way, project)[0]?.[0];
    const points = ring ? [...ring, ring[0]] : wayPoints(way, project);
    for (const piece of barrio.clip(points)) hileras.push({ points: piece.map(([x, z]) => [x, z]), osm: way.id });
  }
  return { arboles: nodes('natural', 'tree'), hileras, faroles: nodes('highway', 'street_lamp') };
}
