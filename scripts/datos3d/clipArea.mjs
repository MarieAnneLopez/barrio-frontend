// Recorte de un área (parque, pasto, agua) a un polígono del barrio, como el ST_Intersection del
// ETL del backend: los tramos del borde del área que quedan dentro del barrio más los tramos del
// borde del barrio que quedan dentro del área se unen en anillos cerrados. Si algún caso raro no
// cierra (bordes superpuestos), se conserva el área completa y se avisa con `fallo`.
import { clipLine } from './clip.mjs';
import { pointInRing } from './inside.mjs';
import { joinWays } from './rings.mjs';

const EPS = 1e-6;
const closed = (ring) => [...ring, ring[0]];
const xz = (arc) => arc.map(([x, z]) => [x, z]);

/** polygon y barrio: [exterior, ...huecos] en metros → { polygons, recortada, fallo? }. */
export function clipPolygon(polygon, barrio) {
  const [outer, ...holes] = polygon;
  const inner = clipLine(closed(outer), barrio);
  if (inner.length === 1 && inner[0].length === outer.length + 1 && inner[0].every((p) => p[2] >= 0)) {
    return { polygons: [polygon], recortada: false };
  }
  if (!inner.length) return { polygons: pointInRing(barrio[0][0], outer) ? [barrio] : [], recortada: true };
  const ends = inner.flatMap((arc) => [arc[0], arc[arc.length - 1]]);
  const snap = ([x, z]) => ends.find((e) => Math.hypot(e[0] - x, e[1] - z) < EPS)?.slice(0, 2) ?? [x, z];
  const border = barrio.flatMap((ring) => clipLine(closed(ring), [outer])).map((arc) => {
    const points = xz(arc);
    return [snap(points[0]), ...points.slice(1, -1), snap(points[points.length - 1])];
  });
  const rings = joinWays([...inner.map(xz), ...border]);
  if (!rings.length) return { polygons: [polygon], recortada: false, fallo: true };
  const polygons = rings.map((ring) => [ring, ...holes.filter((hole) => hole.every((p) => pointInRing(p, ring)))]);
  return { polygons, recortada: true };
}
