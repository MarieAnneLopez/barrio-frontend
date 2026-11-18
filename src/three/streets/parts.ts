import { BufferGeometry, Color, Float32BufferAttribute, type ShaderMaterial } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { END_FRAGMENT, litMaterial, WORLD_VERTEX } from './shading';

// Modelos low-poly por partes (árboles, faroles, semáforos, carros, personas, aviones): cada vértice
// lleva su parte (`aPart`) y el material da a cada una su color de día y de noche, el tinte de la
// instancia, luz propia (de noche) y parpadeo, todo en el shader: una malla instanciada, un dibujo.

export interface Part {
  day: Color;
  night: Color;
  /** Multiplica por el color de la instancia (instanceColor). */
  tint?: boolean;
  /** Luz propia: color y cuánta de día y de noche. */
  glow?: Color;
  glowDay?: number;
  glowNight?: number;
  /** > 0: destellos por segundo (luces de avión); < 0: luz de semáforo (−1 alto, −2 atención, −3 siga). */
  blink?: number;
}

const VERTEX = /* glsl */ `
  attribute float aPart;
  uniform vec3 uPartDay[PARTS];
  uniform vec3 uPartNight[PARTS];
  uniform vec3 uPartGlow[PARTS];
  uniform vec4 uPartFx[PARTS];
  varying vec3 vDay;
  varying vec3 vNight;
  varying vec3 vGlow;
  varying vec3 vNormal;
  float seed(float i) { return fract(sin(i * 12.9898) * 43758.5453); }
  void main() {
    int p = int(aPart + 0.5);
    vec4 fx = uPartFx[p];
    vDay = uPartDay[p];
    vNight = uPartNight[p];
    #ifdef USE_INSTANCING_COLOR
      if (fx.x > 0.5) { vDay *= instanceColor; vNight *= instanceColor; }
    #endif
    float glow = mix(fx.y, fx.z, uNight);
    float id = float(gl_InstanceID);
    if (fx.w > 0.0) glow *= step(0.88, fract(uTime * fx.w + seed(id)));
    if (fx.w < 0.0) {
      float t = fract(uTime / 26.0 + seed(floor(id / 2.0)));
      float slot = t < 0.45 ? 3.0 : (t < 0.55 ? 2.0 : 1.0);
      glow *= abs(slot + fx.w) < 0.5 ? 1.0 : 0.12;
    }
    vGlow = uPartGlow[p] * glow;
    mat3 rotation = mat3(modelMatrix);
    #ifdef USE_INSTANCING
      rotation = rotation * mat3(instanceMatrix);
    #endif
    vNormal = rotation * normal;
    ${WORLD_VERTEX}
  }`;

const FRAGMENT = /* glsl */ `
  varying vec3 vDay;
  varying vec3 vNight;
  varying vec3 vGlow;
  varying vec3 vNormal;
  void main() {
    gl_FragColor = vec4(shade(vDay, vNight, vNormal) + vGlow, 1.0);
    ${END_FRAGMENT}
  }`;

const BLACK = new Color(0, 0, 0);

export function partsMaterial(parts: Part[]): ShaderMaterial {
  const material = litMaterial({
    vertex: VERTEX,
    fragment: FRAGMENT,
    uniforms: {
      uPartDay: { value: parts.map((p) => p.day) },
      uPartNight: { value: parts.map((p) => p.night) },
      uPartGlow: { value: parts.map((p) => p.glow ?? BLACK) },
      uPartFx: { value: parts.map((p) => [p.tint ? 1 : 0, p.glowDay ?? 0, p.glowNight ?? 0, p.blink ?? 0]).flat() },
    },
  });
  material.defines = { PARTS: parts.length };
  return material;
}

/** Une piezas [geometría, parte] en un modelo sin índices (caras planas, low-poly) con `aPart`. */
export function mergeParts(pieces: Array<[BufferGeometry, number]>): BufferGeometry {
  const flat = pieces.map(([g, part]) => {
    const f = g.index ? g.toNonIndexed() : g.clone();
    f.deleteAttribute('uv');
    f.computeVertexNormals();
    f.setAttribute('aPart', new Float32BufferAttribute(new Array<number>(f.getAttribute('position').count).fill(part), 1));
    return f;
  });
  const merged = mergeGeometries(flat) ?? new BufferGeometry();
  flat.forEach((f) => f.dispose());
  pieces.forEach(([g]) => g.dispose());
  return merged;
}
