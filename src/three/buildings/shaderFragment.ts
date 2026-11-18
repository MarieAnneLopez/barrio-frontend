import { LIGHT_GLSL } from '../sky/lightUniforms';
import { FACADE_GLSL } from './shaderFacade';
import { HEIGHT_CLASS_GLSL } from './volume';
import { WINDOW_GLSL } from './windows';

// Fragmento de los edificios. La normal plana sale de las derivadas de la posición (sin atributo de
// normales: mira siempre hacia la cámara). Techo (normal hacia arriba): concreto con variación por
// edificio. Cara de atrás de un muro (solo se ve sobre el techo): el lado de adentro del pretil.
// Cara de adelante: la fachada. Luz del ciclo con lit() (LIGHT_GLSL), resalte del edificio bajo el
// puntero o elegido, espacio de color de salida y niebla como los materiales de three.
export const BUILDINGS_FRAGMENT = /* glsl */ `
uniform vec3 uWall[3];
uniform vec3 uWallNight[3];
uniform vec3 uRoof;
uniform vec3 uRoofNight;
uniform vec3 uTrim;
uniform vec3 uTrimNight;
uniform vec3 uGlass;
uniform vec3 uLamp;
uniform vec3 uLampSoft;
uniform vec3 uHoverColor;
uniform vec3 uSelectColor;
uniform float uLevel;
uniform float uParapet;
${LIGHT_GLSL}
${WINDOW_GLSL}
${HEIGHT_CLASS_GLSL}
#include <fog_pars_fragment>
varying vec3 vWorld;
varying float vBuilding;
varying float vColumn;
varying float vTop;
varying float vMark;
${FACADE_GLSL}
void main() {
  vec3 N = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  float building = floor(vBuilding + 0.5);
  float floors = topLevel(vTop);
  int cls = heightClass(floors);
  float tone = hash01(building, 7.0, 3.0);
  vec3 wall = mix(uWall[cls], uWallNight[cls], uNight) * (0.9 + 0.2 * tone);
  // Remates en concreto claro; en los altos (ya claros) un tono más oscuro que el muro.
  vec3 trim = cls == 2 ? wall * 0.8 : mix(uTrim, uTrimNight, uNight);
  vec3 color;
  if (N.y > 0.5) {
    vec3 roof = mix(uRoof, uRoofNight, uNight);
    roof = mix(roof, wall, 0.2 * step(0.62, hash01(building, 5.0, 1.0)));
    color = lit(roof * (0.88 + 0.24 * hash01(building, 9.0, 2.0)), N);
  } else if (!gl_FrontFacing) {
    color = lit(mix(wall, trim, 0.4) * 0.78, N);
  } else {
    color = facade(wall, trim, N, building, floors);
  }
  float selected = step(1.5, vMark);
  color = mix(color, uSelectColor, 0.55 * selected);
  color = mix(color, uHoverColor, 0.4 * step(0.5, vMark) * (1.0 - selected));
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;
