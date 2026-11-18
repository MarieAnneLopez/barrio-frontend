// Vértice de los edificios: pasa la posición de mundo (la normal plana sale de sus derivadas en el
// fragmento), el edificio, la columna de ventanas y el remate, y marca el edificio bajo el puntero
// (1) o elegido (2). Los valores por edificio son iguales en los tres vértices de cada triángulo,
// así que no hace falta `flat` (que en Direct3D obliga a ANGLE a un camino más lento).
export const BUILDINGS_VERTEX = /* glsl */ `
attribute vec3 aData;
uniform float uHover;
uniform float uSelected;
varying vec3 vWorld;
varying float vBuilding;
varying float vColumn;
varying float vTop;
varying float vMark;
#include <fog_pars_vertex>
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vBuilding = aData.x;
  vColumn = aData.y;
  vTop = aData.z;
  vMark = abs(aData.x - uSelected) < 0.5 ? 2.0 : (abs(aData.x - uHover) < 0.5 ? 1.0 : 0.0);
  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
