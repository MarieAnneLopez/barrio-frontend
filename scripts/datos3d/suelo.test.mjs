// @vitest-environment node
// Suelo y puntos sobre un OSM sintético (proyección identidad: lon = x, lat = z).
import { describe, expect, it } from 'vitest';
import { loadBarrio } from './barrio.mjs';
import { splitElements } from './osm.mjs';
import { buildPuntos } from './puntos.mjs';
import { SPEC } from './spec.mjs';
import { areaClass, buildSuelo } from './suelo.mjs';

const project = ([lon, lat]) => [lon, lat];
const square = { type: 'Feature', bbox: [0, -100, 100, 0], geometry: { type: 'Polygon', coordinates: [[[0, 0], [100, 0], [100, -100], [0, -100], [0, 0]]] } };
const closed = (id, tags, pts) => ({
  type: 'way', id, tags, nodes: [...pts.map((_, i) => id * 10 + i), id * 10],
  geometry: [...pts, pts[0]].map(([x, z]) => ({ lon: x, lat: z })),
});
const line = (id, tags, pts) => ({ type: 'way', id, tags, nodes: pts.map((_, i) => id * 10 + i), geometry: pts.map(([x, z]) => ({ lon: x, lat: z })) });
const osm = splitElements([
  closed(1, { leisure: 'park', name: 'Parque Primavera' }, [[10, -10], [30, -10], [30, -30], [10, -30]]),
  closed(2, { landuse: 'grass' }, [[200, -10], [210, -10], [210, -20]]), // fuera del barrio
  closed(3, { landuse: 'residential', name: 'Conjunto' }, [[40, -40], [60, -40], [60, -60]]), // no es suelo
  line(4, { waterway: 'canal', name: 'Canal Castilla' }, [[50, -50], [50, 50]]),
  line(5, { natural: 'tree_row' }, [[5, -5], [5, -95]]),
  { type: 'node', id: 6, lon: 20, lat: -20, tags: { natural: 'tree' } },
  { type: 'node', id: 7, lon: 500, lat: -20, tags: { natural: 'tree' } },
]);
const barrio = loadBarrio(square, project);

describe('buildSuelo', () => {
  const suelo = buildSuelo(osm, barrio, project, 'El Tintal');

  it('el barrio va primero y luego las áreas verdes o de agua que caen dentro', () => {
    expect(suelo.areas.map((a) => [a.clase, a.nombre, a.osm])).toEqual([
      [SPEC.clasesSuelo.barrio, 'El Tintal', 0],
      [SPEC.clasesSuelo.park, 'Parque Primavera', 1],
    ]);
    expect(suelo.stats.areasFuera).toBe(1);
  });

  it('los canales se recortan al barrio', () => {
    expect(suelo.lineas).toEqual([{ points: [[50, -50], [50, 0]], clase: SPEC.clasesAgua.canal, nombre: 'Canal Castilla', osm: 4 }]);
  });

  it('las clases salen de leisure, landuse, natural y waterway', () => {
    expect([areaClass({ landuse: 'grass' }), areaClass({ natural: 'water' }), areaClass({ landuse: 'residential' })]).toEqual([
      SPEC.clasesSuelo.grass, SPEC.clasesSuelo.water, 0,
    ]);
  });
});

describe('buildPuntos', () => {
  it('árboles e hileras reales del barrio; sin faroles en la fuente, ninguno', () => {
    const puntos = buildPuntos(osm, barrio, project);
    expect(puntos.arboles).toEqual([{ p: [20, -20], osm: 6 }]);
    expect(puntos.hileras).toEqual([{ points: [[5, -5], [5, -95]], osm: 5 }]);
    expect(puntos.faroles).toEqual([]);
  });
});
