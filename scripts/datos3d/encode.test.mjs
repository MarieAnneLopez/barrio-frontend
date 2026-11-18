// @vitest-environment node
// Contenedor binario TNT3 (FORMATO.md): cabecera, tabla de secciones alineada a 8 bytes,
// coordenadas en decímetros con deltas que dan la vuelta en int16, tablas de texto y cabecera gzip.
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { createTable, deltaEncode, gzipStable, quantize, writeContainer } from './encode.mjs';

const view = (bytes) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
const ascii = (bytes, at) => String.fromCharCode(...bytes.subarray(at, at + 4));

describe('writeContainer', () => {
  const bytes = writeContainer(2, [
    { id: 'PISO', type: 'u8', data: Uint8Array.of(3, 12, 1) },
    { id: 'XZ', type: 'i16', data: Int16Array.of(-1, 2, 300) },
    { id: 'TNOM', type: 'utf8', data: ['', 'Ciudad Tintal', 'Ñ'] },
  ]);
  const dv = view(bytes);

  it('empieza con TNT3, versión 1, el tipo de archivo y el número de secciones', () => {
    expect(ascii(bytes, 0)).toBe('TNT3');
    expect([dv.getUint16(4, true), dv.getUint16(6, true), dv.getUint32(8, true)]).toEqual([1, 2, 3]);
  });

  it('cada sección declara id (relleno con espacios), tipo, desplazamiento múltiplo de 8 y largo', () => {
    const entries = [0, 1, 2].map((s) => {
      const at = 12 + 16 * s;
      return [ascii(bytes, at), dv.getUint8(at + 4), dv.getUint32(at + 8, true), dv.getUint32(at + 12, true)];
    });
    expect(entries).toEqual([['PISO', 1, 64, 3], ['XZ  ', 4, 72, 3], ['TNOM', 9, 80, 18]]);
    expect(bytes.length).toBe(104);
  });

  it('los datos quedan en little-endian y el texto en UTF-8 separado por NUL', () => {
    expect([...bytes.subarray(64, 67)]).toEqual([3, 12, 1]);
    expect([dv.getInt16(72, true), dv.getInt16(74, true), dv.getInt16(76, true)]).toEqual([-1, 2, 300]);
    expect(new TextDecoder().decode(bytes.subarray(80, 98))).toBe('\0Ciudad Tintal\0Ñ\0');
  });
});

describe('coordenadas', () => {
  it('cuantiza a decímetros y rechaza lo que no cabe en int16', () => {
    expect(quantize(12.34)).toBe(123);
    expect(quantize(-3276.8)).toBe(-32768);
    expect(() => quantize(3300)).toThrow(/int16/);
  });

  it('cada secuencia arranca absoluta y sigue con deltas que dan la vuelta en int16', () => {
    const out = deltaEncode([[[1, 2], [1.5, 1]], [[-3000, 0], [3000, 0]]]);
    expect([...out]).toEqual([10, 20, 5, -10, -30000, 0, -5536, 0]);
  });
});

describe('tablas y gzip', () => {
  it('la tabla de textos reserva el índice 0 para «sin dato» y no repite', () => {
    const table = createTable();
    expect([table.add('KR 86 # 6-50'), table.add(''), table.add(null), table.add('KR 86 # 6-50')]).toEqual([1, 0, 0, 1]);
    expect(table.list).toEqual(['', 'KR 86 # 6-50']);
  });

  // Los bytes comprimidos dependen del zlib de Node: se repiten con la misma versión de Node.
  it('gzip estable: cabecera sin fecha y con SO desconocido, y vuelve a los mismos bytes', () => {
    const data = new TextEncoder().encode('El Tintal '.repeat(50));
    const packed = gzipStable(data);
    expect([...packed.subarray(0, 2)]).toEqual([0x1f, 0x8b]);
    expect([...packed.subarray(4, 8)]).toEqual([0, 0, 0, 0]);
    expect(packed[9]).toBe(255);
    expect(new Uint8Array(gunzipSync(packed))).toEqual(data);
  });
});
