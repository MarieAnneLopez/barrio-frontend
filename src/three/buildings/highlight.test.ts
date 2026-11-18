import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Color } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crownOf, HIGHLIGHT_GLSL, HOVER_FILL, luminance, SELECT_FILL } from './highlight';
import { createBuildingMaterial } from './material';
import { BUILDINGS_FRAGMENT } from './shaderFragment';

// Colores del tema de los mapas (map-palette.css) en jsdom, como en material.test.ts.
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../styles/map-palette.css'), 'utf8');
const vars = [...css.matchAll(/(--map-[a-z0-9-]+): (#[0-9a-f]{6});/g)];
beforeEach(() => vars.forEach(([, name = '', hex = '']) => document.documentElement.style.setProperty(name, hex)));
afterEach(() => vars.forEach(([, name = '']) => document.documentElement.style.removeProperty(name)));

/** Contraste WCAG 2.x entre dos luminancias relativas. */
const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const marks = () => {
  const { uniforms } = createBuildingMaterial();
  return [
    { name: 'bajo el puntero', tint: uniforms.uHoverColor?.value as Color, fill: HOVER_FILL },
    { name: 'elegido', tint: uniforms.uSelectColor?.value as Color, fill: SELECT_FILL },
  ];
};

describe('resalte de los edificios (bajo el puntero y elegido)', () => {
  it('se ve por luminancia, no solo por el tono: el cuerpo o la corona queda a ≥ 3:1 de cualquier base', () => {
    // La luminancia de una mezcla lineal es la mezcla de las luminancias: basta recorrer [0, 1], que
    // cubre todos los muros, techos y remates del tema, con cualquier luz del ciclo (día o noche).
    for (const { name, tint, fill } of marks()) {
      const [lt, lc] = [luminance(tint), luminance(crownOf(tint))];
      let worst = Infinity;
      for (let l = 0; l <= 1; l += 0.0005) worst = Math.min(worst, Math.max(contrast((1 - fill) * l + fill * lt, l), contrast(lc, l)));
      expect(worst, name).toBeGreaterThanOrEqual(3);
    }
  });

  it('la corona es una sombra del mismo color de la marca (mismo tono, sin otro color)', () => {
    for (const { tint } of marks()) {
      const crown = crownOf(tint);
      expect(crown.r / crown.g).toBeCloseTo(tint.r / tint.g, 6);
      expect(crown.b / crown.g).toBeCloseTo(tint.b / tint.g, 6);
    }
  });

  it('el shader usa la corona del material, que sale de crownOf', () => {
    const { uniforms } = createBuildingMaterial();
    expect((uniforms.uHoverCrown?.value as Color).equals(crownOf(uniforms.uHoverColor?.value as Color))).toBe(true);
    expect((uniforms.uSelectCrown?.value as Color).equals(crownOf(uniforms.uSelectColor?.value as Color))).toBe(true);
    expect(HIGHLIGHT_GLSL).toContain('uniform vec3 uHoverCrown;');
    expect(BUILDINGS_FRAGMENT).toContain(HIGHLIGHT_GLSL);
  });
});
