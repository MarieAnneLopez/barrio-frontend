import { Color, Vector3 } from 'three';

/**
 * Uniformes de luz compartidos por toda la maqueta (gran actualización, D106). SkyDriver los
 * escribe en cada cuadro con skyAt(); los materiales propios (edificios, vías, vida) los incluyen
 * así: `uniforms: { ...LIGHT, miColor: { value } }` (el spread copia las referencias, de modo que
 * todos ven el mismo valor). Los materiales de three con luces (Lambert, Standard) no los necesitan:
 * SkyDriver mueve también una DirectionalLight y una HemisphereLight.
 */
export const LIGHT = {
  /** 0 de día, 1 de noche; suave en el atardecer y el amanecer. */
  uNight: { value: 1 },
  /** 0 fuera del atardecer y el amanecer; 1 en su punto medio. */
  uDusk: { value: 0 },
  /** Hacia el astro que ilumina (unitaria). */
  uLightDir: { value: new Vector3(0.5, 0.8, -0.2).normalize() },
  /** Luz directa con su intensidad ya aplicada. */
  uLightColor: { value: new Color(1, 1, 1) },
  uAmbient: { value: new Color(0.5, 0.5, 0.5) },
  /** Color del horizonte (niebla y reflejos) y del cenit (cúpula del cielo). */
  uHorizon: { value: new Color(0.9, 0.9, 0.9) },
  uZenith: { value: new Color(0.55, 0.78, 0.9) },
  /** Segundos de reloj (Date.now / 1000, recortado para no perder precisión en el shader). */
  uTime: { value: 0 },
};

export type LightUniforms = typeof LIGHT;

/**
 * GLSL común: declara los uniformes y da `vec3 lit(vec3 base, vec3 normal)` (luz difusa + ambiente),
 * para usar en el fragment shader de un ShaderMaterial propio.
 */
export const LIGHT_GLSL = /* glsl */ `
uniform float uNight;
uniform float uDusk;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform vec3 uAmbient;
uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform float uTime;
vec3 lit(vec3 base, vec3 normal) {
  float diffuse = max(dot(normalize(normal), uLightDir), 0.0);
  return base * (uAmbient + uLightColor * diffuse);
}
`;
