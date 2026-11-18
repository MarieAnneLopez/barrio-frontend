// Tipos de public/data/tintal/manifest.json (scripts/datos3d/manifest.mjs y conteos.mjs).
export type TintalFile = 'edificios' | 'vias' | 'suelo' | 'puntos';

export interface ManifestFile { ruta: string; bytes: number; bytesTnt3: number; sha256: string }

/** Conteos por clave (clase, marca…) → número, de mayor a menor. */
export type PorClave = Record<string, number>;

export interface ConteosEdificios {
  total: number; catastro: number; osm: number; pisosCatastro: number; pisosCatastroPct: number;
  placaOficial: number; placaOficialPct: number; placaEnHuella: number; placaDelLote: number;
  placaDeManzana: number; sinPlaca: number; conNombre: number; conNombrePct: number;
  nombreDeEdificio: number; voladizos: number; subterraneas: number;
}

export interface ConteosVias {
  tramos: number; nodos: number; porClase: PorClave; sentidoUnico: number; conCarriles: number;
  recortados: number; cruces: number; crucesPorMarca: PorClave; crucesConSemaforo: number;
  crucesDeCiclorruta: number; semaforos: number;
}

export interface ConteosSuelo {
  areas: number; areasPorClase: PorClave; lineasDeAgua: number; arboles: number;
  hilerasDeArboles: number; faroles: number;
}

export interface TintalManifest {
  version: number;
  /** Fecha de la consulta más reciente a las fuentes. */
  generado: string;
  barrio: { nombre: string; definicion: string; areaKm2: number | null };
  proyeccion: { bbox: [number, number, number, number]; origen: [number, number]; unidadesPorMetro: number };
  licenciaDeLosArchivos: string;
  archivos: Record<TintalFile, ManifestFile>;
  conteos: { edificios: ConteosEdificios; vias: ConteosVias; suelo: ConteosSuelo };
  fuentes: { id: string; nombre: string; licencia: string; atribucion: string; consultado: string }[];
}
