import type { Edificios, Tintal3D } from '../three/data/format';
import { TNT3 } from '../three/data/format';
import { resetTintal3D } from '../three/data/useTintal3D';
import { EMPTY_WORLD } from './emptyWorld';

// Cuatro edificios de prueba, uno por tipo de dirección (FORMATO.md §3, DIRT 1, 2, 3 y 0), cada uno un
// cuadrado de 10 m. Los textos imitan los reales de Catastro y OSM; no son datos de la maqueta.

const square = (x: number, z: number) => [x, z, x + 10, z, x + 10, z + 10, x, z + 10];
const { osm: OSM, pisosConocidos: KNOWN } = TNT3.banderasEdificio;

export const EDIFICIOS: Edificios = {
  count: 4,
  xz: new Float32Array([...square(0, 0), ...square(100, 0), ...square(0, 100), ...square(100, 100)]),
  anillos: new Uint32Array([0, 4, 8, 12, 16]),
  edificios: new Uint32Array([0, 1, 2, 3, 4]),
  pisos: new Uint8Array([6, 3, 2, 1]),
  base: new Uint8Array([0, 0, 2, 0]),
  sotanos: new Uint8Array([1, 0, 0, 0]),
  banderas: new Uint8Array([KNOWN, KNOWN, 0, OSM]),
  tipoDireccion: new Uint8Array([1, 2, 3, 0]),
  direccion: new Uint32Array([1, 2, 3, 0]),
  tipoNombre: new Uint8Array([1, 0, 0, 0]),
  nombre: new Uint32Array([1, 0, 0, 0]),
  lote: new Uint32Array([1, 1, 2, 0]),
  sector: new Uint32Array([1, 1, 1, 0]),
  osm: new Float64Array([0, 0, 0, 456]),
  textos: {
    direcciones: ['', 'KR 88D # 6D-27 TO 6', 'KR 88D # 6D-27', 'CL 6 # 88-10'],
    nombres: ['', 'Conjunto Torres del Parque'],
    origenNombres: ['', 'way/123'],
    lotes: ['', '004627077011', '004627077012'],
    sectores: ['', 'CALANDAIMA'],
  },
};

export const BUILDING_WORLD: Tintal3D = { ...EMPTY_WORLD, edificios: EDIFICIOS };

/** Para las pruebas de la ficha: los datos 3D llegan al instante con estos cuatro edificios. */
export const buildingWorldReady = () =>
  resetTintal3D({ worker: () => Promise.resolve(BUILDING_WORLD), main: () => Promise.resolve(BUILDING_WORLD) });
