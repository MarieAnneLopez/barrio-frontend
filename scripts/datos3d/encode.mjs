// Codificador del contenedor binario TNT3 (especificación byte a byte en FORMATO.md).
// Cabecera de 12 bytes, tabla de secciones de 16 bytes cada una y bloques alineados a 8 bytes,
// todo en little-endian. Las coordenadas van en decímetros (int16) con deltas por secuencia.
import { endianness } from 'node:os';
import { gzipSync } from 'node:zlib';
import { SPEC } from './spec.mjs';

export const VERSION = SPEC.version;
export const SCALE = SPEC.unidadesPorMetro; // decímetros
export const TYPES = SPEC.tipos;
const ARRAYS = {
  u8: Uint8Array, i8: Int8Array, u16: Uint16Array, i16: Int16Array,
  u32: Uint32Array, i32: Int32Array, f32: Float32Array, f64: Float64Array,
};

if (endianness() !== 'LE') throw new Error('El codificador TNT3 asume una máquina little-endian');

const align8 = (n) => Math.ceil(n / 8) * 8;

export function quantize(meters) {
  const q = Math.round(meters * SCALE);
  if (!Number.isFinite(q) || q < -32768 || q > 32767) throw new Error(`Coordenada fuera de int16: ${meters} m`);
  return q;
}

/** Secuencias de puntos [x, z] en metros → int16 intercalados: el primero absoluto, luego deltas. */
export function deltaEncode(sequences) {
  const out = new Int16Array(2 * sequences.reduce((n, s) => n + s.length, 0));
  let k = 0;
  for (const sequence of sequences) {
    let [px, pz] = [0, 0];
    for (const point of sequence) {
      const [x, z] = [quantize(point[0]), quantize(point[1])];
      out[k++] = x - px; // Int16Array da la vuelta sola (módulo 2^16)
      out[k++] = z - pz;
      [px, pz] = [x, z];
    }
  }
  return out;
}

/** Tabla de textos sin repetidos; el índice 0 es siempre "" (sin dato). */
export function createTable() {
  const index = new Map([['', 0]]);
  const list = [''];
  return {
    list,
    add(text) {
      const key = (text ?? '').trim();
      if (!index.has(key)) {
        index.set(key, list.length);
        list.push(key);
      }
      return index.get(key);
    },
  };
}

function sectionBytes({ type, data }) {
  if (type === 'utf8') return new TextEncoder().encode(data.map((s) => `${s.replaceAll('\0', ' ')}\0`).join(''));
  const typed = data instanceof ARRAYS[type] ? data : ARRAYS[type].from(data);
  return new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength);
}

/** sections: [{ id: 'PISO', type: 'u8', data }] → archivo TNT3 sin comprimir. */
export function writeContainer(kind, sections) {
  const blocks = sections.map(sectionBytes);
  let offset = align8(12 + 16 * sections.length);
  const offsets = blocks.map((block) => {
    const at = offset;
    offset = align8(offset + block.length);
    return at;
  });
  const bytes = new Uint8Array(offset);
  const dv = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode(SPEC.magia), 0);
  dv.setUint16(4, VERSION, true);
  dv.setUint16(6, kind, true);
  dv.setUint32(8, sections.length, true);
  sections.forEach(({ id, type, data }, s) => {
    const at = 12 + 16 * s;
    if (!/^[A-Z0-9 ]{1,4}$/.test(id)) throw new Error(`Id de sección inválido: ${id}`);
    bytes.set(new TextEncoder().encode(id.padEnd(4, ' ')), at);
    dv.setUint8(at + 4, TYPES[type]);
    dv.setUint32(at + 8, offsets[s], true);
    dv.setUint32(at + 12, type === 'utf8' ? blocks[s].length : data.length, true);
    bytes.set(blocks[s], offsets[s]);
  });
  return bytes;
}

/** gzip nivel 9 con cabecera estable: sin fecha y con el sistema operativo «desconocido» (255). */
export function gzipStable(bytes) {
  const packed = new Uint8Array(gzipSync(bytes, { level: 9 }));
  packed.fill(0, 4, 8);
  packed[9] = 255;
  return packed;
}
