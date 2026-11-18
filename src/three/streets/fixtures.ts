// Datos TNT3 sintéticos para las pruebas de calles y vida: una red de vías pequeña a mano.
import type { Puntos, Suelo, Vias } from '../data/format';

export interface FixtureWay {
  nodes: number[];
  clase: number;
  sentido?: number;
  carriles?: number;
  vmax?: number;
  banderas?: number;
  nivel?: number;
}

export function makeVias(nodes: ReadonlyArray<readonly [number, number]>, ways: FixtureWay[], cruces: Partial<Vias['cruces']> = {}): Vias {
  const tramos = new Uint32Array(ways.length + 1);
  ways.forEach((w, i) => (tramos[i + 1] = (tramos[i] ?? 0) + w.nodes.length));
  const col = <T extends Uint8Array | Int8Array>(make: new (n: number) => T, pick: (w: FixtureWay) => number) => {
    const out = new make(ways.length);
    ways.forEach((w, i) => (out[i] = pick(w)));
    return out;
  };
  return {
    count: ways.length,
    nodos: Float32Array.from(nodes.flat()),
    tramos,
    indices: Uint32Array.from(ways.flatMap((w) => w.nodes)),
    clase: col(Uint8Array, (w) => w.clase),
    banderas: col(Uint8Array, (w) => w.banderas ?? 0),
    sentido: col(Int8Array, (w) => w.sentido ?? 0),
    carriles: col(Uint8Array, (w) => w.carriles ?? 0),
    vmax: col(Uint8Array, (w) => w.vmax ?? 0),
    nivel: col(Int8Array, (w) => w.nivel ?? 0),
    nombre: new Uint32Array(ways.length),
    osm: new Float64Array(ways.length),
    cruces: {
      xz: new Float32Array(), tipo: new Uint8Array(), angulo: new Float32Array(), largo: new Float32Array(),
      osm: new Float64Array(), ...cruces,
    },
    semaforos: { xz: new Float32Array(), osm: new Float64Array() },
    textos: { nombres: [''] },
  };
}

/** Suelo con áreas de un anillo exterior y sus huecos: [clase, [exterior, ...huecos]]. */
export function makeSuelo(areas: Array<[number, number[][]]>): Suelo {
  const rings = areas.flatMap(([, r]) => r);
  const anillos = new Uint32Array(rings.length + 1);
  rings.forEach((r, i) => (anillos[i + 1] = (anillos[i] ?? 0) + r.length / 2));
  const starts = new Uint32Array(areas.length + 1);
  areas.forEach(([, r], i) => (starts[i + 1] = (starts[i] ?? 0) + r.length));
  return {
    count: areas.length, xz: Float32Array.from(rings.flat()), anillos, areas: starts,
    clase: Uint8Array.from(areas.map(([c]) => c)), nombre: new Uint32Array(areas.length), osm: new Float64Array(areas.length),
    lineas: { count: 0, xz: new Float32Array(), inicios: new Uint32Array([0]), clase: new Uint8Array(), nombre: new Uint32Array(), osm: new Float64Array() },
    textos: { nombres: [''] },
  };
}

export function makePuntos(arboles: number[], hileras: number[][] = []): Puntos {
  const inicios = new Uint32Array(hileras.length + 1);
  hileras.forEach((h, i) => (inicios[i + 1] = (inicios[i] ?? 0) + h.length / 2));
  return {
    arboles: { xz: Float32Array.from(arboles), osm: new Float64Array(arboles.length / 2) },
    hileras: { xz: Float32Array.from(hileras.flat()), inicios, osm: new Float64Array(hileras.length) },
    faroles: { xz: new Float32Array(), osm: new Float64Array() },
  };
}
