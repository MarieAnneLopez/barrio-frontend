// Tipos de los datos 3D reales de El Tintal (formato TNT3, scripts/datos3d/FORMATO.md).
// Coordenadas en metros con la proyección de src/three/projection.ts: x al este, z al sur.
import spec from './tnt3.json';

/** Códigos del formato; el codificador (scripts/datos3d) lee el mismo JSON. */
export const TNT3 = spec;

export type U8 = Uint8Array<ArrayBuffer>;
export type I8 = Int8Array<ArrayBuffer>;
export type U32 = Uint32Array<ArrayBuffer>;
export type F32 = Float32Array<ArrayBuffer>;
export type F64 = Float64Array<ArrayBuffer>;
export type TintalFile = 'edificios' | 'vias' | 'suelo' | 'puntos';

export interface Edificios {
  count: number;
  /** Vértices intercalados [x0, z0, x1, z1, …] en metros; anillos abiertos (sin repetir el primero). */
  xz: F32;
  /** Inicio de cada anillo en vértices (R + 1 valores). */
  anillos: U32;
  /** Inicio de cada edificio en anillos (N + 1): el primero es el exterior, los demás son huecos. */
  edificios: U32;
  /** Pisos del volumen: empieza en el piso `base` (voladizos) y llega a base + pisos. */
  pisos: U8;
  base: U8;
  sotanos: U8;
  /** banderas: TNT3.banderasEdificio · tipoDireccion: TNT3.tipoDireccion · tipoNombre: TNT3.tipoNombre */
  banderas: U8;
  tipoDireccion: U8;
  direccion: U32;
  tipoNombre: U8;
  nombre: U32;
  lote: U32;
  sector: U32;
  /** Id OSM: > 0 vía (way), < 0 relación, 0 si viene de Catastro. */
  osm: F64;
  textos: { direcciones: string[]; nombres: string[]; origenNombres: string[]; lotes: string[]; sectores: string[] };
}

export interface Puntos2D { xz: F32; osm: F64 }
export interface Lineas { count: number; xz: F32; inicios: U32; clase: U8; nombre: U32; osm: F64 }

export interface Vias {
  count: number;
  /** Nodos únicos de la red [x, z, …]; los tramos los comparten en los cruces. */
  nodos: F32;
  /** Inicio de cada tramo en `indices` (W + 1). */
  tramos: U32;
  indices: U32;
  /** clase: TNT3.clasesVia · banderas: TNT3.banderasVia */
  clase: U8;
  banderas: U8;
  /** 1 sentido único a favor del dibujo, -1 en contra, 0 doble sentido. */
  sentido: I8;
  carriles: U8;
  vmax: U8;
  nivel: I8;
  nombre: U32;
  osm: F64;
  /** tipo: TNT3.cruces; angulo: eje de la vía (rad, atan2(dz, dx) en [0, π)); largo en m (0 sin dato). */
  cruces: { xz: F32; tipo: U8; angulo: F32; largo: F32; osm: F64 };
  semaforos: Puntos2D;
  textos: { nombres: string[] };
}

export interface Suelo {
  count: number;
  xz: F32;
  anillos: U32;
  /** Inicio de cada área en anillos (A + 1); clase: TNT3.clasesSuelo (la primera es el barrio). */
  areas: U32;
  clase: U8;
  nombre: U32;
  osm: F64;
  /** Canales y quebradas (TNT3.clasesAgua), recortados al barrio. */
  lineas: Lineas;
  textos: { nombres: string[] };
}

export interface Puntos { arboles: Puntos2D; hileras: { xz: F32; inicios: U32; osm: F64 }; faroles: Puntos2D }

export interface ManifestFile { ruta: string; bytes: number; bytesTnt3: number; sha256: string }

export interface TintalManifest {
  version: number;
  generado: string;
  proyeccion: { bbox: [number, number, number, number]; origen: [number, number]; unidadesPorMetro: number };
  archivos: Record<TintalFile, ManifestFile>;
  conteos: Record<string, Record<string, number>>;
  fuentes: { id: string; nombre: string; licencia: string; atribucion: string; consultado: string }[];
}

export interface Tintal3D { manifest: TintalManifest; edificios: Edificios; vias: Vias; suelo: Suelo; puntos: Puntos }
