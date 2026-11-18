// Elementos de Overpass (`out geom`) → geometrías proyectadas en metros.
import { multipolygon } from './rings.mjs';

export const osmRef = (element) => `${element.type}/${element.id}`;
/** Id numérico para el formato: vías y nodos positivos, relaciones negativas. */
export const osmId = (element) => (element.type === 'relation' ? -element.id : element.id);

export function splitElements(elements) {
  return {
    nodes: elements.filter((e) => e.type === 'node'),
    ways: elements.filter((e) => e.type === 'way'),
    relations: elements.filter((e) => e.type === 'relation'),
  };
}

export const wayPoints = (way, project) => (way.geometry ?? []).map((g) => project([g.lon, g.lat]));

/** Polígonos [[exterior, ...huecos]] de una vía cerrada o de un multipolígono; [] si no es un área. */
export function osmPolygons(element, project) {
  if (element.type === 'way') {
    const ids = element.nodes ?? [];
    const closed = ids.length >= 4 && ids[0] === ids[ids.length - 1];
    return closed ? [[wayPoints(element, project).slice(0, -1)]] : [];
  }
  if (element.type !== 'relation' || !['multipolygon', 'boundary'].includes(element.tags?.type)) return [];
  const members = (element.members ?? [])
    .filter((m) => m.type === 'way' && Array.isArray(m.geometry) && m.geometry.every(Boolean))
    .map((m) => ({ role: m.role, points: m.geometry.map((g) => project([g.lon, g.lat])) }));
  return multipolygon(members);
}

/** Anillos [x, z] de una geometría GeoJSON Polygon o MultiPolygon (WGS84); cleanPolygon quita el cierre. */
export function geojsonPolygons(geometry, project) {
  const polygons = geometry?.type === 'Polygon' ? [geometry.coordinates] : geometry?.type === 'MultiPolygon' ? geometry.coordinates : [];
  return polygons.map((rings) => rings.map((ring) => ring.map((p) => project(p))));
}
