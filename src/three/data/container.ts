// Lector del contenedor TNT3 (FORMATO.md): cabecera, tabla de secciones y bloques alineados.
// Cada sección se copia a su propio ArrayBuffer, así cada arreglo se transfiere por separado.
import { TNT3, type F64, type I8, type U32, type U8 } from './format';

export class FormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FormatError';
  }
}

type SectionType = keyof typeof TNT3.tipos;
interface Entry { type: number; offset: number; count: number }

export interface Sections {
  kind: number;
  u8(id: string): U8;
  i8(id: string): I8;
  u16(id: string): Uint16Array<ArrayBuffer>;
  i16(id: string): Int16Array<ArrayBuffer>;
  u32(id: string): U32;
  f64(id: string): F64;
  /** Tabla de textos: el índice 0 es siempre "" (sin dato). */
  text(id: string): string[];
}

const ascii = (buffer: ArrayBuffer, at: number) => String.fromCharCode(...new Uint8Array(buffer, at, 4));

function header(buffer: ArrayBuffer, expectedKind: number): { kind: number; entries: Map<string, Entry> } {
  if (buffer.byteLength < 12) throw new FormatError('Archivo TNT3 demasiado corto');
  const dv = new DataView(buffer);
  const magic = ascii(buffer, 0);
  if (magic !== TNT3.magia) throw new FormatError(`No es un archivo TNT3 (firma «${magic}»)`);
  const version = dv.getUint16(4, true);
  if (version !== TNT3.version) throw new FormatError(`Archivo TNT3 versión ${version}; se esperaba ${TNT3.version}`);
  const kind = dv.getUint16(6, true);
  if (kind !== expectedKind) throw new FormatError(`Archivo TNT3 de tipo ${kind}; se esperaba ${expectedKind}`);
  const count = dv.getUint32(8, true);
  if (12 + 16 * count > buffer.byteLength) throw new FormatError('Tabla de secciones TNT3 cortada');
  const entries = new Map<string, Entry>();
  for (let s = 0; s < count; s++) {
    const at = 12 + 16 * s;
    const entry = { type: dv.getUint8(at + 4), offset: dv.getUint32(at + 8, true), count: dv.getUint32(at + 12, true) };
    entries.set(ascii(buffer, at).trimEnd(), entry);
  }
  return { kind, entries };
}

export function readContainer(buffer: ArrayBuffer, expectedKind: number): Sections {
  const { kind, entries } = header(buffer, expectedKind);
  const bytes = (id: string, type: SectionType, size: number): ArrayBuffer => {
    const entry = entries.get(id);
    if (!entry) throw new FormatError(`Falta la sección ${id}`);
    if (entry.type !== TNT3.tipos[type]) throw new FormatError(`La sección ${id} no es de tipo ${type}`);
    const end = entry.offset + entry.count * size;
    if (entry.offset % 8 !== 0 || end > buffer.byteLength) throw new FormatError(`La sección ${id} se sale del archivo`);
    return buffer.slice(entry.offset, end);
  };
  return {
    kind,
    u8: (id) => new Uint8Array(bytes(id, 'u8', 1)),
    i8: (id) => new Int8Array(bytes(id, 'i8', 1)),
    u16: (id) => new Uint16Array(bytes(id, 'u16', 2)),
    i16: (id) => new Int16Array(bytes(id, 'i16', 2)),
    u32: (id) => new Uint32Array(bytes(id, 'u32', 4)),
    f64: (id) => new Float64Array(bytes(id, 'f64', 8)),
    text: (id) => {
      const list = new TextDecoder().decode(bytes(id, 'utf8', 1)).split('\0');
      list.pop(); // cada texto termina en NUL: el último pedazo está vacío
      return list;
    },
  };
}
