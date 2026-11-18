// @vitest-environment node
// Lectura de etiquetas OSM de vías y cruces (clases y banderas en src/three/data/tnt3.json).
import { describe, expect, it } from 'vitest';
import { crossingType, roadAttributes } from './osmtags.mjs';
import { SPEC } from './spec.mjs';

const C = SPEC.clasesVia;
const B = SPEC.banderasVia;
const X = SPEC.cruces;

describe('roadAttributes', () => {
  it('clase, carriles, velocidad y nivel desde highway, lanes, maxspeed y layer', () => {
    expect(roadAttributes({ highway: 'tertiary', lanes: '2', maxspeed: '30', name: 'Calle 6' })).toEqual({
      clase: C.tertiary, sentido: 0, carriles: 2, vmax: 30, nivel: 0, banderas: 0,
    });
    expect(roadAttributes({ highway: 'primary', bridge: 'yes', layer: '1', lanes: '3;2' })).toMatchObject({
      clase: C.primary, carriles: 3, nivel: 1, banderas: B.puente,
    });
  });

  it('sentido: oneway, el contrario (-1), glorietas y autopistas', () => {
    expect(roadAttributes({ highway: 'residential', oneway: 'yes' }).sentido).toBe(1);
    expect(roadAttributes({ highway: 'residential', oneway: '-1' }).sentido).toBe(-1);
    expect(roadAttributes({ highway: 'residential', oneway: 'no' }).sentido).toBe(0);
    expect(roadAttributes({ highway: 'secondary', junction: 'roundabout' })).toMatchObject({ sentido: 1, banderas: B.glorieta });
    expect(roadAttributes({ highway: 'motorway' }).sentido).toBe(1);
  });

  it('enlaces, andenes, cruces peatonales, acceso privado, solo bus y áreas peatonales', () => {
    expect(roadAttributes({ highway: 'primary_link' })).toMatchObject({ clase: C.primary, banderas: B.enlace });
    expect(roadAttributes({ highway: 'footway', footway: 'sidewalk' }).clase).toBe(C.sidewalk);
    expect(roadAttributes({ highway: 'footway', footway: 'crossing' }).clase).toBe(C.crossing);
    expect(roadAttributes({ highway: 'service', access: 'private' }).banderas).toBe(B.accesoRestringido);
    expect(roadAttributes({ highway: 'busway' }).banderas).toBe(B.soloBus);
    expect(roadAttributes({ highway: 'primary', access: 'no', bus: 'designated' }).banderas).toBe(B.accesoRestringido | B.soloBus);
    expect(roadAttributes({ highway: 'pedestrian', area: 'yes' })).toMatchObject({ clase: C.pedestrian, banderas: B.area });
  });

  it('lo que no existe en el terreno queda fuera (proposed, abandoned, plataformas)', () => {
    for (const highway of ['proposed', 'abandoned', 'platform', 'bus_stop', 'razed']) {
      expect(roadAttributes({ highway })).toBeNull();
    }
  });
});

describe('crossingType', () => {
  it('marcas: cebra explícita, marcado, sin marcas o desconocidas', () => {
    expect(crossingType({ crossing: 'zebra' })).toBe(X.cebra);
    expect(crossingType({ 'crossing:markings': 'zebra' })).toBe(X.cebra);
    expect(crossingType({ crossing_ref: 'zebra', crossing: 'uncontrolled' })).toBe(X.cebra);
    expect(crossingType({ crossing: 'uncontrolled' })).toBe(X.marcado);
    expect(crossingType({ crossing: 'marked' })).toBe(X.marcado);
    expect(crossingType({ 'crossing:markings': 'yes' })).toBe(X.marcado);
    expect(crossingType({ crossing: 'unmarked' })).toBe(X.sinMarcas);
    expect(crossingType({ 'crossing:markings': 'no' })).toBe(X.sinMarcas);
    expect(crossingType({})).toBe(0);
  });

  it('semáforo como bandera aparte, y la marca de que viene de una vía', () => {
    expect(crossingType({ crossing: 'traffic_signals' })).toBe(X.semaforo);
    expect(crossingType({ crossing: 'traffic_signals', 'crossing:markings': 'zebra' })).toBe(X.semaforo | X.cebra);
    expect(crossingType({ crossing: 'marked' }, true)).toBe(X.marcado | X.deVia);
  });
});
