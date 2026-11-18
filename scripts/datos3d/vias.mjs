// Red vial y peatonal de OSM recortada al barrio, con nodos compartidos: dos tramos que pasan por
// el mismo nodo OSM usan el mismo índice, así carros y personitas pueden recorrerla como un grafo.
// Los cortes en el borde del barrio son nodos nuevos y el tramo lleva la bandera «recortada».
import { buildCrossings } from './cruces.mjs';
import { roadAttributes } from './osmtags.mjs';
import { wayPoints } from './osm.mjs';
import { SPEC } from './spec.mjs';

const B = SPEC.banderasVia;

export function buildVias(osm, barrio, project) {
  const nodes = [];
  const byOsm = new Map();
  const indexOf = (id, point) => {
    if (id === null) return nodes.push(point) - 1;
    if (!byOsm.has(id)) byOsm.set(id, nodes.push(point) - 1);
    return byOsm.get(id);
  };
  const ways = [];
  const pieces = [];
  for (const way of osm.ways) {
    const tags = way.tags ?? {};
    const attrs = tags.highway ? roadAttributes(tags) : null;
    if (!attrs) continue;
    for (const piece of barrio.clip(wayPoints(way, project))) {
      const ids = piece.map(([, , k]) => (k >= 0 ? way.nodes[k] : null));
      const clipped = ids[0] === null || ids[ids.length - 1] === null;
      ways.push({
        nodes: piece.map(([x, z], i) => indexOf(ids[i], [x, z])), ...attrs,
        banderas: attrs.banderas | (clipped ? B.recortada : 0), nombre: (tags.name ?? '').trim(), osm: way.id,
      });
      pieces.push({ way, tags, ids, points: piece.map(([x, z]) => [x, z]), clase: attrs.clase });
    }
  }
  const inside = (node) => barrio.inside(project([node.lon, node.lat]));
  const signals = osm.nodes.filter((n) => n.tags?.highway === 'traffic_signals' && inside(n));
  const semaforos = signals.map((n) => ({ p: project([n.lon, n.lat]), osm: n.id }));
  const cruces = buildCrossings(osm.nodes.filter((n) => isCrossingNode(n.tags) && inside(n)), pieces, project);
  return { nodes, ways, cruces, semaforos };
}

/** highway=crossing, o un semáforo que también es cruce (highway=traffic_signals + crossing=*). */
function isCrossingNode(tags = {}) {
  if (tags.highway === 'crossing') return true;
  return tags.highway === 'traffic_signals' && tags.crossing !== undefined && tags.crossing !== 'no';
}
