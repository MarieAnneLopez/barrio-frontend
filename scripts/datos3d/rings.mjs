// Anillos en metros [x, z]: multipolígonos OSM a partir de sus vías miembro y limpieza para el
// formato TNT3 (decímetros, sin repetidos, exterior antihorario visto desde arriba, huecos horarios).
import { signedArea } from './geo.mjs';
import { pointInRing } from './inside.mjs';

const key = ([x, z]) => `${x},${z}`;
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

/** Une tramos por extremos iguales hasta cerrar anillos; lo que no cierra se descarta. */
export function joinWays(lines) {
  const pending = lines.filter((l) => l.length >= 2).map((l) => [...l]);
  const rings = [];
  while (pending.length) {
    const ring = pending.shift();
    let grew = true;
    while (!same(ring[0], ring[ring.length - 1]) && grew) {
      grew = false;
      const end = key(ring[ring.length - 1]);
      const at = pending.findIndex((l) => key(l[0]) === end || key(l[l.length - 1]) === end);
      if (at >= 0) {
        const [next] = pending.splice(at, 1);
        ring.push(...(key(next[0]) === end ? next : next.reverse()).slice(1));
        grew = true;
      }
    }
    if (same(ring[0], ring[ring.length - 1]) && ring.length >= 4) rings.push(ring.slice(0, -1));
  }
  return rings;
}

/** members: [{ role: 'outer'|'inner', points }] → polígonos [[exterior, ...huecos]]. */
export function multipolygon(members) {
  const of = (role) => joinWays(members.filter((m) => (m.role || 'outer') === role).map((m) => m.points));
  const polygons = of('outer').map((outer) => [outer]);
  for (const inner of of('inner')) {
    const host = polygons
      .filter(([outer]) => pointInRing(inner[0], outer))
      .sort((a, b) => Math.abs(signedArea(a[0])) - Math.abs(signedArea(b[0])))[0];
    host?.push(inner);
  }
  return polygons;
}

const dm = (v) => Math.round(v * 10) / 10;

function cleanRing(ring, outer) {
  const out = [];
  for (const [x, z] of ring) {
    const p = [dm(x), dm(z)];
    if (!out.length || !same(out[out.length - 1], p)) out.push(p);
  }
  while (out.length > 1 && same(out[0], out[out.length - 1])) out.pop();
  if (out.length < 3 || Math.abs(signedArea(out)) < 0.01) return null;
  return signedArea(out) > 0 === outer ? out : [out[0], ...out.slice(1).reverse()]; // mismo primer vértice
}

/** Polígono limpio para el formato, o null si su exterior no tiene área. */
export function cleanPolygon([outer, ...holes]) {
  const ring = cleanRing(outer, true);
  if (!ring) return null;
  return [ring, ...holes.map((hole) => cleanRing(hole, false)).filter(Boolean)];
}
