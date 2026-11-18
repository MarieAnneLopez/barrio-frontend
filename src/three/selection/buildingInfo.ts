// Lo que la ficha dice de un edificio, leído de los datos reales (TNT3, FORMATO.md §3): nombre (de un
// edificio o área de OSM), la placa de Catastro con su procedencia (DIRT), pisos, lote, sector y el id
// OSM si el edificio viene de allí. Función pura: la ficha decide cómo presentarlo.
import { TNT3, type Edificios } from '../data/format';

/** 0 sin placa · 1 placa dentro de la huella · 2 la más cercana de su lote · 3 de su manzana. */
export type AddressKind = 0 | 1 | 2 | 3;

export interface BuildingInfo {
  name: string | null;
  /** Origen del nombre en OSM (`way/123`, `relation/456`). */
  nameRef: string | null;
  address: string | null;
  addressKind: AddressKind;
  /** Pisos del volumen; null si la fuente no los da: la ficha dice «pisos sin dato». */
  floors: number | null;
  /** Piso donde empieza el volumen (≥ 1 en voladizos) y sótanos. */
  base: number;
  basements: number;
  lot: string | null;
  sector: string | null;
  /** Id OSM: > 0 vía, < 0 relación, 0 si el edificio viene de Catastro. */
  osm: number;
  underConstruction: boolean;
  /** Centro de la huella (promedio del anillo exterior), en metros: x al este, z al sur. */
  center: [number, number];
}

const FLAGS = TNT3.banderasEdificio;
const text = (list: readonly string[], index: number | undefined): string | null => (index ? list[index] || null : null);

function ringCenter(e: Edificios, index: number): [number, number] {
  const ring = e.edificios[index] ?? 0;
  const [from, to] = [e.anillos[ring] ?? 0, e.anillos[ring + 1] ?? 0];
  let [x, z] = [0, 0];
  for (let v = from; v < to; v++) [x, z] = [x + (e.xz[2 * v] ?? 0), z + (e.xz[2 * v + 1] ?? 0)];
  const n = Math.max(1, to - from);
  return [x / n, z / n];
}

export function buildingInfo(e: Edificios, index: number): BuildingInfo | null {
  if (!Number.isInteger(index) || index < 0 || index >= e.count) return null;
  const flags = e.banderas[index] ?? 0;
  const dirt = e.tipoDireccion[index] ?? 0;
  const named = (e.tipoNombre[index] ?? 0) > 0;
  const address = dirt > 0 && dirt <= 3 ? text(e.textos.direcciones, e.direccion[index]) : null;
  return {
    name: named ? text(e.textos.nombres, e.nombre[index]) : null,
    nameRef: named ? text(e.textos.origenNombres, e.nombre[index]) : null,
    address,
    addressKind: (address ? dirt : 0) as AddressKind,
    floors: flags & FLAGS.pisosConocidos ? (e.pisos[index] ?? 0) : null,
    base: e.base[index] ?? 0,
    basements: e.sotanos[index] ?? 0,
    lot: text(e.textos.lotes, e.lote[index]),
    sector: text(e.textos.sectores, e.sector[index]),
    osm: e.osm[index] ?? 0,
    underConstruction: (flags & FLAGS.enConstruccion) !== 0,
    center: ringCenter(e, index),
  };
}

/** Referencia OSM de un id numérico: > 0 vía (`way/123`), < 0 relación (`relation/456`). */
export const osmRef = (id: number): string => (id > 0 ? `way/${id}` : `relation/${-id}`);

/** Página del objeto en OpenStreetMap: id numérico (vía o relación) o referencia `way/123`. */
export function osmUrl(ref: number | string): string {
  return `https://www.openstreetmap.org/${typeof ref === 'string' ? ref : osmRef(ref)}`;
}
