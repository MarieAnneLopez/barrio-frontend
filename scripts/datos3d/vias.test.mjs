// @vitest-environment node
// Red vial con nodos compartidos, recorte en el borde, cruces y semáforos sobre un OSM sintético.
// Proyección identidad: lon = x, lat = z (los módulos solo ven metros).
import { describe, expect, it } from 'vitest';
import { loadBarrio } from './barrio.mjs';
import { splitElements } from './osm.mjs';
import { SPEC } from './spec.mjs';
import { buildVias } from './vias.mjs';

const project = ([lon, lat]) => [lon, lat];
const square = { type: 'Feature', bbox: [0, -100, 100, 0], geometry: { type: 'Polygon', coordinates: [[[0, 0], [100, 0], [100, -100], [0, -100], [0, 0]]] } };
const node = (id, x, z, tags) => ({ type: 'node', id, lon: x, lat: z, ...(tags && { tags }) });
const way = (id, tags, pts) => ({
  type: 'way', id, tags, nodes: pts.map((p) => p[0]), geometry: pts.map(([, x, z]) => ({ lon: x, lat: z })),
});
const elements = [
  way(1, { highway: 'residential', oneway: 'yes', name: 'Calle 1' }, [[10, 10, -50], [11, 50, -50], [12, 90, -50]]),
  way(2, { highway: 'footway', footway: 'crossing', crossing: 'zebra' }, [[20, 50, -45], [11, 50, -50], [21, 50, -55]]),
  way(3, { highway: 'tertiary' }, [[30, 50, -20], [31, 50, 50]]),
  way(4, { highway: 'footway', footway: 'crossing', crossing: 'zebra' }, [[40, 80, -60], [41, 80, -70]]),
  way(5, { highway: 'proposed' }, [[50, 0, -10], [51, 90, -10]]),
  node(11, 50, -50, { highway: 'crossing', crossing: 'uncontrolled' }),
  node(10, 10, -50, { highway: 'traffic_signals' }),
];
const red = buildVias(splitElements(elements), loadBarrio(square, project), project);
const C = SPEC.clasesVia;
const X = SPEC.cruces;

describe('buildVias', () => {
  it('cada vía existente es un tramo; lo propuesto queda fuera', () => {
    expect(red.ways.map((w) => w.osm)).toEqual([1, 2, 3, 4]);
    expect(red.ways.map((w) => w.clase)).toEqual([C.residential, C.crossing, C.tertiary, C.crossing]);
    expect(red.ways[0]).toMatchObject({ sentido: 1, nombre: 'Calle 1' });
  });

  it('el nodo OSM compartido es el mismo índice en los dos tramos', () => {
    expect(red.ways[0].nodes[1]).toBe(red.ways[1].nodes[1]);
    expect(red.nodes[red.ways[0].nodes[1]]).toEqual([50, -50]);
    expect(new Set(red.ways.flatMap((w) => w.nodes)).size).toBe(red.nodes.length);
  });

  it('lo que sale del barrio se corta en el borde con un nodo nuevo y la bandera recortada', () => {
    const cut = red.ways[2];
    expect(cut.nodes.map((i) => red.nodes[i])).toEqual([[50, -20], [50, 0]]);
    expect(cut.banderas & SPEC.banderasVia.recortada).toBeTruthy();
    expect(red.ways[0].banderas & SPEC.banderasVia.recortada).toBe(0);
  });

  it('cruce en nodo: eje de la calle, largo y marcas de su vía de cruce; vía sin nodo: punto medio', () => {
    expect(red.cruces).toHaveLength(2);
    const [atNode, fromWay] = red.cruces;
    // El nodo dice «marcado» (uncontrolled) y su vía dice cebra: gana la marca más precisa.
    expect(atNode).toMatchObject({ p: [50, -50], tipo: X.cebra, angulo: 0, largo: 10, osm: 11 });
    expect(fromWay.p).toEqual([80, -65]);
    expect(fromWay).toMatchObject({ tipo: X.cebra | X.deVia, largo: 10, osm: 4 });
    expect(fromWay.angulo).toBeCloseTo(0, 9);
  });

  it('semáforos reales en su punto', () => {
    expect(red.semaforos).toEqual([{ p: [10, -50], osm: 10 }]);
  });
});
