// Fixture pequeño para las pruebas del decodificador (src/three/data): sale del mismo codificador
// que arma los datos reales (layouts.mjs + gzipStable), así formato y prueba no pueden separarse.
import { gzipStable } from './encode.mjs';
import { edificiosFile, puntosFile, sueloFile, viasFile } from './layouts.mjs';

const square = (x, z, d) => [[x, z], [x + d, z], [x + d, z - d], [x, z - d]];
const hole = (x, z, d) => [...square(x, z, d)].reverse();

export const FIXTURE_LAYERS = {
  edificios: [
    {
      rings: [square(0, 0, 10), hole(3, -3, 4)], pisos: 3, base: 0, sotanos: 1, banderas: 2,
      tipoDireccion: 1, direccion: 'KR 88D # 6D-27 TO 6', tipoNombre: 2, nombre: 'Ciudad Tintal SM3 SL1',
      nombreRef: 'way/123', lote: '004601018028', sector: 'CIUDAD TINTAL', osm: 0,
    },
    {
      rings: [[[2000, 1000], [2010.4, 1000], [2005, 991.3]]], pisos: 0, base: 0, sotanos: 0, banderas: 1,
      tipoDireccion: 0, direccion: '', tipoNombre: 1, nombre: 'Biblioteca El Tintal',
      nombreRef: 'way/252078999', lote: '', sector: '', osm: 252078999,
    },
    {
      rings: [square(10, 0, 2)], pisos: 2, base: 1, sotanos: 0, banderas: 6, tipoDireccion: 2,
      direccion: 'KR 88D # 6D-27 TO 6', tipoNombre: 0, nombre: '', lote: '004601018028',
      sector: 'CIUDAD TINTAL', osm: 0,
    },
  ],
  vias: {
    nodes: [[0, 0], [50, 0], [50, -50], [-3000, 1200]],
    ways: [
      { nodes: [0, 1], clase: 7, sentido: 1, carriles: 2, vmax: 30, nivel: 0, banderas: 0, nombre: 'Carrera 90', osm: 28118664 },
      { nodes: [1, 2], clase: 21, sentido: 0, carriles: 0, vmax: 0, nivel: 0, banderas: 0, nombre: '', osm: 5 },
      {
        nodes: [2, 3], clase: 3, sentido: -1, carriles: 3, vmax: 0, nivel: 1, banderas: 130,
        nombre: 'Avenida Ciudad de Cali', osm: 7,
      },
    ],
    cruces: [{ p: [25, 0], tipo: 5, angulo: 1.5708, largo: 7.5, osm: 99 }],
    semaforos: [{ p: [50, 0], osm: 77 }],
  },
  suelo: {
    areas: [
      { rings: [square(-100, 100, 300)], clase: 1, nombre: 'El Tintal', osm: 0 },
      { rings: [square(20, -20, 30)], clase: 2, nombre: 'Parque Metropolitano El Tintal', osm: -14577696 },
    ],
    lineas: [{ points: [[0, 10], [100, 10]], clase: 1, nombre: 'Canal Castilla', osm: 555 }],
  },
  puntos: {
    arboles: [{ p: [1, 1], osm: 1 }, { p: [2.25, -2], osm: 2 }],
    hileras: [{ points: [[0, 0], [10, 0], [20, 0]], osm: 3 }],
    faroles: [],
  },
};

/** Los cuatro archivos del fixture, comprimidos como en public/data/tintal. */
export function buildFixture() {
  return {
    edificios: gzipStable(edificiosFile(FIXTURE_LAYERS.edificios)),
    vias: gzipStable(viasFile(FIXTURE_LAYERS.vias)),
    suelo: gzipStable(sueloFile(FIXTURE_LAYERS.suelo)),
    puntos: gzipStable(puntosFile(FIXTURE_LAYERS.puntos)),
  };
}
