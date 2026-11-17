// Material de cada tarjeta. El vértice enrolla el plano sobre un cilindro (la misma cuenta que
// bendPoint) y lo ondula un poco; el fragmento recorta las esquinas con una SDF antialiasada,
// dibuja el borde y oscurece lo que se aparta de la cámara.
import { Color, FrontSide, ShaderMaterial, type Texture } from 'three';
import { BEND_REST, HALF_WIDTH, PLANE, RIPPLE } from './reelBend';

/** Número como literal GLSL (siempre con decimales). */
const glsl = (value: number) => value.toFixed(5);
/** Cuánto oscurece una cara que se gira del todo: sombreado sutil de la curvatura. */
const SHADE = 1.1;
/** Ancho, en px, del anillo del color del fondo que rodea cada tarjeta; por dentro va la línea de 1 px. */
export const RING = 1.5;

export const VERTEX = /* glsl */ `
uniform float uBend;
uniform float uTime;
uniform float uSeed;
varying vec2 vUv;
varying float vFacing;

void main() {
  vUv = uv;
  vec3 p = position;
  float angle = (p.x / ${glsl(HALF_WIDTH)}) * uBend;
  float radius = ${glsl(HALF_WIDTH)} / uBend;
  p.x = sin(angle) * radius;
  p.z += (cos(angle) - 1.0) * radius;
  p.y += sin(position.x * 2.6 + uTime * 1.2 + uSeed) * ${glsl(RIPPLE)};
  vFacing = normalize(normalMatrix * vec3(sin(angle), 0.0, cos(angle))).z;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

export const FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uLine;
uniform vec3 uGap;
uniform float uRadius;
uniform float uPixel;
varying vec2 vUv;
varying float vFacing;

void main() {
  vec2 size = vec2(${glsl(PLANE.width)}, ${glsl(PLANE.height)});
  vec2 q = abs((vUv - 0.5) * size) - (size * 0.5 - uRadius);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius; // distancia al borde redondeado
  float px = fwidth(d);
  float alpha = 1.0 - smoothstep(-px, 0.0, d);
  float ring = uPixel * ${glsl(RING)}; // anillo del color del fondo: separa la tarjeta de lo que tapa
  float gap = smoothstep(-ring - px, -ring, d);
  float line = smoothstep(-ring - uPixel - px, -ring - uPixel, d) - gap; // línea de 1 px
  float shade = 1.0 - ${glsl(SHADE)} * (1.0 - clamp(vFacing, 0.0, 1.0));
  vec3 color = mix(texture2D(uMap, vUv).rgb * shade, uLine, line);
  gl_FragColor = vec4(mix(color, uGap, gap), alpha);
  #include <colorspace_fragment>
}
`;

/** Uniformes que comparten las 14 tarjetas: se cambian una vez por cuadro. */
export interface SharedUniforms {
  uBend: { value: number };
  uTime: { value: number };
  /** Radio exterior de las esquinas y tamaño de 1 px de pantalla, en unidades del plano. */
  uRadius: { value: number };
  uPixel: { value: number };
  uLine: { value: Color };
  uGap: { value: Color };
}

export const createSharedUniforms = (): SharedUniforms => ({
  uBend: { value: BEND_REST },
  uTime: { value: 0 },
  uRadius: { value: 0.02 },
  uPixel: { value: 0.004 },
  uLine: { value: new Color() },
  uGap: { value: new Color() },
});

/** Transparente (el lienzo no tiene fondo), sin profundidad (manda el orden de dibujo) y sin caras traseras. */
export function createCardMaterial(map: Texture, shared: SharedUniforms, seed: number): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { ...shared, uMap: { value: map }, uSeed: { value: seed } },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: FrontSide,
  });
}
