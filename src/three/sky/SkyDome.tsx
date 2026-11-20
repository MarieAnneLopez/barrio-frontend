import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { BackSide, Color, ShaderMaterial } from 'three';
import { mapColor } from '../../lib/cssToken';
import { LIGHT } from './lightUniforms';
import { ATMOSPHERE_GLSL } from './atmosphere';
import { MOON_GLSL } from './SunMoon';
import { STAR_GLSL } from './stars';

const VERTEX = /* glsl */ `
varying vec3 vDir;
varying vec3 vClip;
void main() {
  vDir = position;
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vClip = clip.xyw;
  gl_Position = clip.xyww;
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
varying vec3 vClip;
uniform float uTime, uAspect, uDetail;
uniform vec3 uLightDir;
${STAR_GLSL}
${ATMOSPHERE_GLSL}
${MOON_GLSL}
void main() {
  vec3 dir = normalize(vDir);
  float h = abs(dir.y);
  vec3 color = mix(uHorizon, uZenith, pow(h, 0.55));
  float star = starAt(dir) * smoothstep(0.04, 0.3, h) * uNight;
  color += aurora(dir, uTime, uDetail) + moonlight(dir, uLightDir);
  color += asteroid(vClip.xy / vClip.z, uAspect, uTime);
  gl_FragColor = vec4(mix(color, uStar, star), 1.0);
  #include <colorspace_fragment>
}
`;

/**
 * Cúpula nocturna. SkyDriver fija la iluminación de NIGHT_SKY y actualiza el tiempo de los efectos.
 * Se dibuja antes que la maqueta, sin niebla ni escritura de profundidad.
 */
export function SkyDome({ radius, density }: { radius: number; density: number }) {
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: SKY_FRAGMENT,
        uniforms: {
          uZenith: LIGHT.uZenith,
          uHorizon: LIGHT.uHorizon,
          uNight: LIGHT.uNight,
          uTime: LIGHT.uTime,
          uLightDir: LIGHT.uLightDir,
          uDetail: { value: density },
          uAspect: { value: aspect },
          uStar: { value: new Color(mapColor('ciclo-estrella')) },
        },
        side: BackSide,
        depthWrite: false,
        depthTest: false,
        fog: false,
      }),
    [aspect, density],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[radius, 32, 16]} />
    </mesh>
  );
}
