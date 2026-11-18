import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Color, DoubleSide } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LIGHT } from '../sky/lightUniforms';
import { createBuildingMaterial, NO_BUILDING } from './material';
import { BUILDINGS_FRAGMENT } from './shaderFragment';
import { BUILDINGS_VERTEX } from './shaderVertex';

// Los colores salen del tema de los mapas: se cargan las variables de map-palette.css en jsdom.
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../styles/map-palette.css'), 'utf8');
const vars = [...css.matchAll(/(--map-[a-z0-9-]+): (#[0-9a-f]{6});/g)];

beforeEach(() => vars.forEach(([, name = '', hex = '']) => document.documentElement.style.setProperty(name, hex)));
afterEach(() => vars.forEach(([, name = '']) => document.documentElement.style.removeProperty(name)));

describe('material de los edificios', () => {
  it('comparte los uniformes de luz del ciclo (misma referencia) y trae los de la niebla', () => {
    const m = createBuildingMaterial();
    expect(m.uniforms.uNight).toBe(LIGHT.uNight);
    expect(m.uniforms.uZenith).toBe(LIGHT.uZenith);
    expect(m.uniforms.uTime).toBe(LIGHT.uTime);
    expect(Object.keys(m.uniforms)).toEqual(expect.arrayContaining(['fogColor', 'fogNear', 'fogFar']));
    expect([m.fog, m.side]).toEqual([true, DoubleSide]);
    expect([m.uniforms.uHover?.value, m.uniforms.uSelected?.value]).toEqual([NO_BUILDING, NO_BUILDING]);
    m.dispose();
  });

  it('toma los colores del tema: muros de día por clase, techo, ventana encendida y selección', () => {
    const m = createBuildingMaterial();
    const hex = (c: unknown) => `#${(c as Color).getHexString()}`;
    expect((m.uniforms.uWall?.value as Color[]).map(hex)).toEqual(['#c98a64', '#b16e4b', '#e6d8bf']);
    expect([hex(m.uniforms.uRoof?.value), hex(m.uniforms.uLamp?.value)]).toEqual(['#8d8a84', '#ffd27a']);
    expect([hex(m.uniforms.uHoverColor?.value), hex(m.uniforms.uSelectColor?.value)]).toEqual(['#fdcf76', '#f6a7c1']);
    m.dispose();
  });

  it('los shaders no traen colores sueltos y usan luz, ventanas, niebla y espacio de color de three', () => {
    for (const glsl of [BUILDINGS_VERTEX, BUILDINGS_FRAGMENT]) expect(glsl).not.toMatch(/#[0-9a-f]{6}\b/i);
    expect(BUILDINGS_FRAGMENT).toContain('vec3 lit(vec3 base, vec3 normal)');
    expect(BUILDINGS_FRAGMENT).toContain('windowLit(');
    expect(BUILDINGS_FRAGMENT).toContain('#include <fog_fragment>');
    expect(BUILDINGS_FRAGMENT).toContain('#include <colorspace_fragment>');
    expect(BUILDINGS_VERTEX).toContain('#include <fog_vertex>');
    expect(BUILDINGS_VERTEX).not.toContain('flat '); // sin varyings planas (camino lento en ANGLE/D3D)
  });
});
