import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { EXAGGERATION } from '../referenceView';
import { BUILDINGS_FRAGMENT } from './shaderFragment';
import { DEFAULT_LEVELS, HEIGHT_CLASS_GLSL, heightClass, LEVEL_HEIGHT, METERS_PER_LEVEL, volumeOf } from './volume';

const F = TNT3.banderasEdificio;
const one = (pisos: number, base: number, banderas: number) => ({
  pisos: Uint8Array.of(pisos),
  base: Uint8Array.of(base),
  banderas: Uint8Array.of(banderas),
});

describe('volumen de un edificio (FORMATO §3)', () => {
  it('un piso dibujado mide 3,2 m reales por la exageración vertical de la referencia (D83)', () => {
    expect(METERS_PER_LEVEL).toBe(3.2);
    expect(LEVEL_HEIGHT).toBeCloseTo(3.2 * EXAGGERATION);
  });

  it('va de base × h a (base + pisos) × h con los pisos de Catastro', () => {
    expect(volumeOf(one(5, 0, F.pisosConocidos), 0)).toEqual({ bottom: 0, top: 5 * LEVEL_HEIGHT, levels: 5, known: true });
    // Voladizo: arranca en el piso 1 y tiene 2 pisos → del piso 1 al 3.
    const overhang = volumeOf(one(2, 1, F.pisosConocidos | F.voladizo), 0);
    expect(overhang?.bottom).toBeCloseTo(LEVEL_HEIGHT);
    expect(overhang?.top).toBeCloseTo(3 * LEVEL_HEIGHT);
  });

  it('sin pisos conocidos (OSM sin building:levels) usa la regla de 3 pisos y lo marca', () => {
    expect(DEFAULT_LEVELS).toBe(3);
    expect(volumeOf(one(0, 0, F.osm), 0)).toEqual({ bottom: 0, top: 3 * LEVEL_HEIGHT, levels: 3, known: false });
  });

  it('las construcciones subterráneas o de 0 pisos conocidos no asoman', () => {
    expect(volumeOf(one(0, 0, F.pisosConocidos | F.subterranea), 0)).toBeNull();
    expect(volumeOf(one(0, 0, F.pisosConocidos), 0)).toBeNull();
  });

  it('clase de altura del tema por el piso del remate (base + pisos): hasta 3, de 4 a 6 y 7 o más', () => {
    const cls = (pisos: number, base = 0) => {
      const volume = volumeOf(one(pisos, base, F.pisosConocidos), 0);
      return volume ? heightClass(volume) : null;
    };
    expect([1, 3, 4, 6, 7, 23].map((pisos) => cls(pisos))).toEqual([0, 0, 1, 1, 2, 2]);
    // Casa de 4 pisos con voladizo de 3 pisos desde el piso 1: los dos rematan en el piso 4 (medio).
    expect([cls(4), cls(3, 1)]).toEqual([1, 1]);
    expect(cls(2, 5)).toBe(2); // remata en el piso 7
  });

  it('el shader calcula la clase con la misma expresión, desde el remate de cada vértice (vTop)', () => {
    expect(HEIGHT_CLASS_GLSL).toContain('floor(top / uLevel + 0.5)');
    expect(HEIGHT_CLASS_GLSL).toContain('level >= 7.0 ? 2 : (level >= 4.0 ? 1 : 0)');
    expect(BUILDINGS_FRAGMENT).toContain(HEIGHT_CLASS_GLSL);
    expect(BUILDINGS_FRAGMENT).toContain('float floors = topLevel(vTop);\n  int cls = heightClass(floors);');
  });
});
