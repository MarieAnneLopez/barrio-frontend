import manifest from '../../public/data/tintal/manifest.json';
import type { Tintal3D, TintalManifest } from '../three/data/format';
import { resetTintal3D } from '../three/data/useTintal3D';

// Un barrio vacío (cero edificios, vías, áreas y árboles) con el manifiesto real, para las pruebas de
// la interfaz que envuelve la maqueta: jsdom no tiene WebGL ni Web Worker, y la escena se sustituye.

const f32 = () => new Float32Array();
const f64 = () => new Float64Array();
const u8 = () => new Uint8Array();
const u32 = () => new Uint32Array();
const start = () => new Uint32Array([0]);
const points = () => ({ xz: f32(), osm: f64() });

export const EMPTY_WORLD: Tintal3D = {
  manifest: manifest as unknown as TintalManifest, // el JSON importado tipa la caja como number[]
  edificios: {
    count: 0, xz: f32(), anillos: start(), edificios: start(), pisos: u8(), base: u8(), sotanos: u8(), banderas: u8(),
    tipoDireccion: u8(), direccion: u32(), tipoNombre: u8(), nombre: u32(), lote: u32(), sector: u32(), osm: f64(),
    textos: { direcciones: [], nombres: [], origenNombres: [], lotes: [], sectores: [] },
  },
  vias: {
    count: 0, nodos: f32(), tramos: start(), indices: u32(), clase: u8(), banderas: u8(), sentido: new Int8Array(),
    carriles: u8(), vmax: u8(), nivel: new Int8Array(), nombre: u32(), osm: f64(),
    cruces: { xz: f32(), tipo: u8(), angulo: f32(), largo: f32(), osm: f64() }, semaforos: points(), textos: { nombres: [] },
  },
  suelo: {
    count: 0, xz: f32(), anillos: start(), areas: start(), clase: u8(), nombre: u32(), osm: f64(),
    lineas: { count: 0, xz: f32(), inicios: start(), clase: u8(), nombre: u32(), osm: f64() }, textos: { nombres: [] },
  },
  puntos: { arboles: points(), hileras: { xz: f32(), inicios: start(), osm: f64() }, faroles: points() },
};

const never = () => new Promise<Tintal3D>(() => undefined);

/** Por defecto los datos 3D no llegan nunca (la escena no se monta), como antes sin la API simulada. */
export const worldPending = () => resetTintal3D({ worker: never, main: never });

/** Para las pruebas que montan la maqueta (con TintalScene sustituida): los datos llegan al instante. */
export const worldReady = () => resetTintal3D({ worker: () => Promise.resolve(EMPTY_WORLD), main: () => Promise.resolve(EMPTY_WORLD) });
