import { Color, type ShaderMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import { markMaterial, poolMaterial } from './flatMaterials';
import { readStreetPalette } from './palette';
import { partsMaterial } from './parts';
import { asphaltMaterial, sidewalkMaterial } from './roadMaterials';
import { dayNightMaterial } from './shading';

// jsdom no tiene WebGL: no se puede compilar, pero sí revisar que cada uniforme que usa una etapa
// del shader esté declarado en ella y tenga valor (un uniforme sin declarar rompe la compilación).

const palette = readStreetPalette();
const pair = { day: new Color(1, 1, 1), night: new Color(0.2, 0.2, 0.2) };
const materials: Record<string, ShaderMaterial> = {
  dayNight: dayNightMaterial(),
  asphalt: asphaltMaterial(palette),
  sidewalk: sidewalkMaterial(palette),
  mark: markMaterial(pair),
  pool: poolMaterial(new Color(1, 1, 0), 0.5, 1),
  parts: partsMaterial([pair, { ...pair, tint: true, glow: new Color(1, 0, 0), glowNight: 1, blink: 2 }]),
};

const used = (source: string) => new Set(source.match(/\bu[A-Z]\w*/g) ?? []);
const declared = (source: string) => new Set([...source.matchAll(/uniform\s+\w+\s+(u[A-Z]\w*)/g)].map((m) => m[1]));

describe('shaders de calles y vida', () => {
  for (const [name, material] of Object.entries(materials)) {
    it(`${name}: cada uniforme usado está declarado en su etapa y tiene valor`, () => {
      for (const stage of [material.vertexShader, material.fragmentShader]) {
        const missing = [...used(stage)].filter((u) => !declared(stage).has(u));
        expect(missing, name).toEqual([]);
        for (const u of used(stage)) expect(material.uniforms[u], `${name}.${u}`).toBeDefined();
      }
      expect(material.fog).toBe(name !== 'pool');
    });
  }
});
