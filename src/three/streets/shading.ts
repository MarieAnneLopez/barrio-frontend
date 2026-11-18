import {
  AdditiveBlending, NormalBlending, ShaderMaterial, UniformsLib, UniformsUtils, type IUniform, type Side,
} from 'three';
import { LIGHT, LIGHT_GLSL } from '../sky/lightUniforms';

// Materiales propios de calles y vida (D106): leen los uniformes de luz compartidos (LIGHT), la
// niebla de la escena y salen en sRGB como los de three. De día, el color del día con sol y cielo
// (lit); de noche, el color medido en la referencia (D83) con un toque de luna.

export const SHADE_GLSL = /* glsl */ `
vec3 shade(vec3 day, vec3 night, vec3 normal) {
  vec3 n = normalize(normal);
  vec3 moon = night * (0.8 + 0.45 * max(dot(n, uLightDir), 0.0));
  return mix(lit(day, n), moon, uNight);
}
`;

/** Cierre del fragment shader: tono, espacio de color y niebla, en el orden de three. */
export const END_FRAGMENT = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
`;

/** Posición del vértice con instancias (si las hay) y niebla; deja `vec4 world`. */
export const WORLD_VERTEX = /* glsl */ `
  vec4 local = vec4(position, 1.0);
  #ifdef USE_INSTANCING
    local = instanceMatrix * local;
  #endif
  vec4 world = modelMatrix * local;
  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
`;

export interface LitOptions {
  vertex: string;
  fragment: string;
  uniforms?: Record<string, IUniform>;
  /** Luz sumada sin escribir profundidad (halos de faroles y faros). */
  additive?: boolean;
  side?: Side;
}

export function litMaterial({ vertex, fragment, uniforms = {}, additive = false, side }: LitOptions): ShaderMaterial {
  const material = new ShaderMaterial({
    uniforms: { ...UniformsUtils.clone(UniformsLib.fog), ...LIGHT, ...uniforms },
    vertexShader: `#include <common>\n#include <fog_pars_vertex>\n${vertex}`,
    fragmentShader: `#include <common>\n#include <fog_pars_fragment>\n${LIGHT_GLSL}\n${SHADE_GLSL}\n${fragment}`,
    fog: true,
    transparent: additive,
    depthWrite: !additive,
    blending: additive ? AdditiveBlending : NormalBlending,
  });
  if (side !== undefined) material.side = side;
  return material;
}

/** Material de las mallas con color de día y de noche por vértice (Sink): suelo, cintas, puentes. */
export function dayNightMaterial(): ShaderMaterial {
  return litMaterial({
    vertex: /* glsl */ `
      attribute vec3 colorDay;
      attribute vec3 colorNight;
      varying vec3 vDay;
      varying vec3 vNight;
      varying vec3 vNormal;
      void main() {
        vDay = colorDay;
        vNight = colorNight;
        vNormal = mat3(modelMatrix) * normal;
        ${WORLD_VERTEX}
      }`,
    fragment: /* glsl */ `
      varying vec3 vDay;
      varying vec3 vNight;
      varying vec3 vNormal;
      void main() {
        gl_FragColor = vec4(shade(vDay, vNight, vNormal), 1.0);
        ${END_FRAGMENT}
      }`,
  });
}
