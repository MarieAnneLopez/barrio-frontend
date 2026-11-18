import { useMemo } from 'react';
import { BackSide, Color, ShaderMaterial } from 'three';
import { mapColor } from '../../lib/cssToken';
import { LIGHT } from './lightUniforms';
import { STAR_GLSL } from './stars';

const VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Degradado del horizonte al cenit, igual hacia arriba y hacia abajo: la maqueta flota en medio del
// cielo. De noche salen estrellas alrededor: puntos en celdas pequeñas de la esfera (stars.ts).
export const SKY_FRAGMENT = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uStar;
uniform float uNight;
varying vec3 vDir;
${STAR_GLSL}
void main() {
  vec3 dir = normalize(vDir);
  float h = abs(dir.y);
  vec3 color = mix(uHorizon, uZenith, pow(h, 0.55));
  float star = starAt(dir) * smoothstep(0.04, 0.3, h) * uNight;
  gl_FragColor = vec4(mix(color, uStar, star), 1.0);
  #include <colorspace_fragment>
}
`;

/**
 * Cúpula del cielo (D106): sigue el ciclo con los uniformes compartidos (LIGHT). Va lejos, sin
 * niebla ni escritura de profundidad, y se dibuja primero: nunca tapa la maqueta.
 */
export function SkyDome({ radius }: { radius: number }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: SKY_FRAGMENT,
        uniforms: {
          uZenith: LIGHT.uZenith,
          uHorizon: LIGHT.uHorizon,
          uNight: LIGHT.uNight,
          uStar: { value: new Color(mapColor('ciclo-estrella')) },
        },
        side: BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  return (
    <mesh material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[radius, 32, 16]} />
    </mesh>
  );
}
