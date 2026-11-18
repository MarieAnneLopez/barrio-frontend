import type { Color, ShaderMaterial } from 'three';
import { END_FRAGMENT, litMaterial, WORLD_VERTEX } from './shading';
import type { DayNight } from './sink';

// Materiales de lo plano e instanciado: marcas pintadas (cebras, ciclorrutas) y halos de luz que se
// suman de noche (faroles en el suelo, faros de los carros).

export function markMaterial(color: DayNight): ShaderMaterial {
  return litMaterial({
    vertex: `void main() { ${WORLD_VERTEX} }`,
    fragment: /* glsl */ `
      uniform vec3 uDay;
      uniform vec3 uNightColor;
      void main() {
        gl_FragColor = vec4(shade(uDay, uNightColor, vec3(0.0, 1.0, 0.0)), 1.0);
        ${END_FRAGMENT}
      }`,
    uniforms: { uDay: { value: color.day }, uNightColor: { value: color.night } },
  });
}

/**
 * Halo de luz sumado (sin escribir profundidad) en un cuadrado con uv: disco suave (`cone` = 0) o
 * abanico que se aleja del borde v = 0 (`cone` = 1, faros). Solo de noche (uNight).
 */
export function poolMaterial(color: Color, strength: number, cone = 0): ShaderMaterial {
  const material = litMaterial({
    additive: true,
    vertex: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        ${WORLD_VERTEX}
      }`,
    fragment: /* glsl */ `
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform float uStrength;
      uniform float uCone;
      void main() {
        vec2 p = vUv - 0.5;
        float disc = 1.0 - smoothstep(0.0, 0.5, length(p));
        float beam = (1.0 - vUv.y) * (1.0 - smoothstep(0.0, 0.18 + 0.32 * vUv.y, abs(p.x)));
        float a = mix(disc * disc, beam * beam, uCone);
        gl_FragColor = vec4(uColor * a * uStrength * uNight, 1.0);
        ${END_FRAGMENT}
      }`,
    uniforms: { uColor: { value: color }, uStrength: { value: strength }, uCone: { value: cone } },
  });
  material.fog = false;
  return material;
}
