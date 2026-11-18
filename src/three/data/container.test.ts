// @vitest-environment node
// Lector del contenedor TNT3 frente al codificador real (scripts/datos3d/encode.mjs).
import { describe, expect, it } from 'vitest';
import { deltaEncode, writeContainer } from '../../../scripts/datos3d/encode.mjs';
import { FormatError, readContainer } from './container';
import { decodeCoords } from './coords';

const sample = () =>
  writeContainer(3, [
    { id: 'CLAS', type: 'u8', data: [2, 8] },
    { id: 'SENT', type: 'i8', data: [-1, 1] },
    { id: 'OSMI', type: 'f64', data: [-14577696, 252078999] },
    { id: 'TNOM', type: 'utf8', data: ['', 'Parque Primavera', 'Ñandú'] },
  ]);

describe('readContainer', () => {
  it('lee cada sección con su tipo y la tabla de textos con el índice 0 vacío', () => {
    const sections = readContainer(sample().buffer, 3);
    expect([...sections.u8('CLAS')]).toEqual([2, 8]);
    expect([...sections.i8('SENT')]).toEqual([-1, 1]);
    expect([...sections.f64('OSMI')]).toEqual([-14577696, 252078999]);
    expect(sections.text('TNOM')).toEqual(['', 'Parque Primavera', 'Ñandú']);
  });

  it('cada arreglo tiene su propio buffer (se puede transferir sin arrastrar los demás)', () => {
    const sections = readContainer(sample().buffer, 3);
    expect(sections.u8('CLAS').buffer).not.toBe(sections.i8('SENT').buffer);
    expect(sections.u8('CLAS').buffer.byteLength).toBe(2);
  });

  it('rechaza otra firma, otra versión, otro tipo de archivo, secciones ausentes o de otro tipo', () => {
    const bytes = sample();
    expect(() => readContainer(bytes.buffer, 1)).toThrow(FormatError);
    const sections = readContainer(bytes.buffer, 3);
    expect(() => sections.u8('NADA')).toThrow(/NADA/);
    expect(() => sections.u32('CLAS')).toThrow(/CLAS/);
    const wrongVersion = bytes.slice();
    wrongVersion[4] = 9;
    expect(() => readContainer(wrongVersion.buffer, 3)).toThrow(/versión/);
    const wrongMagic = bytes.slice();
    wrongMagic[0] = 0x58;
    expect(() => readContainer(wrongMagic.buffer, 3)).toThrow(/TNT3/);
    expect(() => readContainer(bytes.slice(0, 40).buffer, 3)).toThrow(FormatError);
  });
});

describe('decodeCoords', () => {
  it('reconstruye metros desde decímetros con deltas, reiniciando en cada secuencia', () => {
    const raw = deltaEncode([[[1, 2], [1.5, 1]], [[-3000, 0], [3000, 0], [2999.9, -0.1]]]);
    const xz = decodeCoords(raw, Uint32Array.of(0, 2, 5));
    expect([...xz].map((v) => Math.round(v * 10) / 10)).toEqual([1, 2, 1.5, 1, -3000, 0, 3000, 0, 2999.9, -0.1]);
  });

  it('sin inicios trata todo como una sola secuencia', () => {
    const raw = deltaEncode([[[10, -10], [12.5, -7.5]]]);
    expect([...decodeCoords(raw)]).toEqual([10, -10, 12.5, -7.5]);
  });

  it('rechaza inicios que no cubren todos los vértices', () => {
    expect(() => decodeCoords(Int16Array.of(1, 2, 3, 4), Uint32Array.of(0, 1))).toThrow(FormatError);
  });
});
