// Suelo del escenario (propuesta): una rejilla de líneas marrones bajo la cinta que avanza con ella
// y se desvanece con la distancia hasta dejar ver el crema del fondo (el lienzo es transparente).
import { Color, DoubleSide, Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import { HALF_H } from './ribbonGeometry';
import { glsl } from './ribbonGlsl';

/** Altura del suelo, lado de cada celda, extensión y desvanecido (por distancia a la cámara). */
export const FLOOR = { y: -0.62 * HALF_H, cell: HALF_H / 8, width: 640, depth: 300, near: 30, alpha: 0.45, fade: [22, 72] } as const;

const VERTEX = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const FLOOR_FRAGMENT = /* glsl */ `
uniform vec3 uLine;
uniform float uOffset;
varying vec3 vWorld;
void main() {
  vec2 cell = vec2(vWorld.x + uOffset, vWorld.z) / ${glsl(FLOOR.cell)};
  vec2 width = fwidth(cell);
  vec2 grid = abs(fract(cell - 0.5) - 0.5) / width;
  float line = 1.0 - min(min(grid.x, grid.y), 1.0);
  float lod = 1.0 - smoothstep(0.25, 0.5, max(width.x, width.y)); // celdas de pocos px: sin muaré
  float fade = 1.0 - smoothstep(${glsl(FLOOR.fade[0])}, ${glsl(FLOOR.fade[1])}, distance(vWorld.xz, cameraPosition.xz));
  gl_FragColor = vec4(uLine, line * lod * fade * ${glsl(FLOOR.alpha)});
  #include <colorspace_fragment>
}
`;

export interface Floor {
  mesh: Mesh;
  /** Desplazamiento de la cinta: las líneas avanzan con las tarjetas. */
  setOffset(offset: number): void;
  setColor(color: string): void;
  dispose(): void;
}

export function createFloor(): Floor {
  const uniforms = { uLine: { value: new Color() }, uOffset: { value: 0 } };
  const geometry = new PlaneGeometry(FLOOR.width, FLOOR.depth);
  const material = new ShaderMaterial({
    uniforms, vertexShader: VERTEX, fragmentShader: FLOOR_FRAGMENT, transparent: true, depthTest: false, depthWrite: false, side: DoubleSide,
  });
  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, FLOOR.y, FLOOR.near - FLOOR.depth / 2);
  mesh.renderOrder = -1e6; // se dibuja antes que cualquier tarjeta
  return {
    mesh,
    setOffset(offset) {
      uniforms.uOffset.value = offset % FLOOR.cell; // la rejilla se repite: así la precisión no se pierde
    },
    setColor(color) {
      uniforms.uLine.value.set(color);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
