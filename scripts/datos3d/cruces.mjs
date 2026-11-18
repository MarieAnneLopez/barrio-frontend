// Cruces peatonales de OSM. Cada nodo highway=crossing va en su punto exacto con el eje de la vía
// de carros que lo atraviesa; si además está sobre una vía footway=crossing, toma su largo (y sus
// marcas si el nodo no las trae o son menos precisas). Las vías footway=crossing sin nodo de cruce
// entran por su punto medio, con el eje de la calle perpendicular a su trazo.
import { crossingType } from './osmtags.mjs';
import { SPEC } from './spec.mjs';

const CROSSING = SPEC.clasesVia.crossing;
const X = SPEC.cruces;
const MARKS = 3; // los dos bits de marcas

/** Eje (sin sentido) del tramo a→b: atan2(dz, dx) llevado a [0, π). */
const axis = (a, b) => (((Math.atan2(b[1] - a[1], b[0] - a[0]) % Math.PI) + Math.PI) % Math.PI);
const lengthOf = (pts) => pts.reduce((t, p, i) => (i ? t + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

function midpoint(points) {
  let left = lengthOf(points) / 2;
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    const step = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (step >= left && step > 0) return { p: [a[0] + ((b[0] - a[0]) * left) / step, a[1] + ((b[1] - a[1]) * left) / step], a, b };
    left -= step;
  }
  return { p: points[0], a: points[0], b: points[points.length - 1] };
}

const around = (pts, k) => [pts[Math.max(0, k - 1)], pts[Math.min(pts.length - 1, k + 1)]];

function fromNode(node, refs, project, used) {
  const road = refs.find((r) => r.piece.clase < 20);
  const walk = refs.find((r) => r.piece.clase === CROSSING);
  let tipo = crossingType(node.tags ?? {});
  let angulo = 0;
  if (road) angulo = axis(...around(road.piece.points, road.k));
  else if (walk) angulo = (axis(...around(walk.piece.points, walk.k)) + Math.PI / 2) % Math.PI;
  else tipo |= X.sinEje;
  let largo = 0;
  if (walk) {
    used.add(walk.piece);
    largo = lengthOf(walk.piece.points);
    const fromWay = crossingType(walk.piece.tags);
    const [own, way] = [tipo & MARKS, fromWay & MARKS];
    if (!own || (own === X.marcado && way === X.cebra)) tipo = (tipo & ~MARKS) | way; // la marca más precisa
    tipo |= fromWay & X.semaforo;
  }
  return { p: project([node.lon, node.lat]), tipo, angulo, largo, osm: node.id };
}

/** nodes: nodos highway=crossing del barrio; pieces: tramos recortados con sus ids de nodo OSM. */
export function buildCrossings(nodes, pieces, project) {
  const at = new Map();
  for (const piece of pieces) {
    piece.ids.forEach((id, k) => {
      if (id !== null) (at.get(id) ?? at.set(id, []).get(id)).push({ piece, k });
    });
  }
  const used = new Set();
  const out = nodes.map((node) => fromNode(node, at.get(node.id) ?? [], project, used));
  for (const piece of pieces) {
    if (piece.clase !== CROSSING || used.has(piece)) continue;
    const { p, a, b } = midpoint(piece.points);
    out.push({ p, tipo: crossingType(piece.tags, true), angulo: (axis(a, b) + Math.PI / 2) % Math.PI, largo: lengthOf(piece.points), osm: piece.way.id });
  }
  return out;
}
