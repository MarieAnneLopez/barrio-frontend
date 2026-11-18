// Shaders de cada tarjeta. El vértice desliza el plano por la superficie (la misma cuenta que
// surfaceAt y deform en ribbonGeometry.ts) y saca la normal analítica; el fragmento recorta las
// esquinas con una SDF, cubre el plano con la foto, sombrea y pone encima la franja de la etiqueta.
import { SURFACE } from './ribbonGeometry';
import { LIGHT, SHADING } from './ribbonShading';

/** Número como literal GLSL (siempre con decimales). */
export const glsl = (value: number): string => value.toFixed(5);
/** Anillo de foco, en px desde el borde: amarillo por fuera, negro por dentro (como el foco doble). */
export const RING = { outer: 3, inner: 5 } as const;

export const VERTEX = /* glsl */ `
uniform float uHalfW;
uniform float uCenter;
uniform vec2 uSize;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormal;
const float PI = 3.141592653589793;

void main() {
  vUv = uv;
  float x = uCenter + position.x * uSize.x;
  float y = position.y * uSize.y;
  float q = (x / uHalfW) * ${glsl(SURFACE.stretch)} - ${glsl(SURFACE.shift)};
  float g = exp(-q * q);
  float sq = sin(PI * q);
  float cq = cos(PI * q);
  float slope = (PI * cq - 2.0 * q * sq) * g;
  float curve = ((4.0 * q * q - 2.0 - PI * PI) * sq - 4.0 * PI * q * cq) * g;
  float s = clamp(x / uHalfW, -1.0, 1.0);
  float dq = ${glsl(SURFACE.stretch)} / uHalfW;
  float bank = -${glsl(SURFACE.bank)} * slope / PI;
  float cb = cos(bank);
  float sb = sin(bank);
  float z = -${glsl(SURFACE.depth)} * uHalfW * sq * g - ${glsl(SURFACE.hinge)} * uHalfW * s * (1.5 - 0.5 * s * s);
  float zSlope = -${glsl(SURFACE.depth)} * uHalfW * slope * dq - ${glsl(SURFACE.hinge * 1.5)} * (1.0 - s * s) * step(abs(x), uHalfW);
  float bankSlope = -${glsl(SURFACE.bank)} * curve * dq / PI;
  vec3 p = vec3(x, y * cb, y * sb + z);
  vNormal = vec3(-y * bankSlope - zSlope * cb, -sb, cb);
  vWorld = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
`;

export const FRAGMENT = /* glsl */ `
uniform sampler2D uPhoto;
uniform sampler2D uLabel;
uniform float uHasPhoto;
uniform vec4 uCover;
uniform vec2 uSize;
uniform float uRadius;
uniform float uPixel;
uniform float uLabelBand;
uniform float uDepthRange;
uniform float uFocus;
uniform vec3 uPlaceholder;
uniform vec3 uSheen;
uniform vec3 uRing;
uniform vec3 uRingInner;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormal;

void main() {
  vec2 q = abs((vUv - 0.5) * uSize) - (uSize * 0.5 - uRadius);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius; // distancia al borde redondeado
  float aa = fwidth(d);
  float alpha = 1.0 - smoothstep(-aa, 0.0, d);
  vec3 base = mix(uPlaceholder, texture2D(uPhoto, vUv * uCover.xy + uCover.zw).rgb, uHasPhoto);
  float depth = 1.0 - ${glsl(SHADING.darken)} * clamp(-vWorld.z / uDepthRange, 0.0, 1.0);
  vec3 n = normalize(vNormal);
  vec3 l = vec3(${LIGHT.map(glsl).join(', ')});
  vec3 v = normalize(cameraPosition - vWorld);
  float diffuse = ${glsl(1 - SHADING.diffuse)} + ${glsl(SHADING.diffuse)} * max(dot(n, l), 0.0);
  float spec = ${glsl(SHADING.specular)} * pow(max(dot(n, normalize(l + v)), 0.0), ${glsl(SHADING.shininess)});
  vec3 color = base * depth * diffuse + uSheen * spec * depth;
  vec4 label = texture2D(uLabel, vec2(vUv.x, vUv.y / uLabelBand)) * step(vUv.y, uLabelBand);
  color = mix(color, label.rgb * max(depth, ${glsl(SHADING.labelFloor)}) * diffuse, label.a);
  float outer = smoothstep(-uPixel * ${glsl(RING.outer)} - aa, -uPixel * ${glsl(RING.outer)}, d);
  float inner = smoothstep(-uPixel * ${glsl(RING.inner)} - aa, -uPixel * ${glsl(RING.inner)}, d) - outer;
  color = mix(mix(color, uRingInner, inner * uFocus), uRing, outer * uFocus);
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
`;
