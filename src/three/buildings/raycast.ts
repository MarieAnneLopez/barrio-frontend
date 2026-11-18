import { Box3, Matrix4, Ray, Triangle, Vector3, type Intersection, type Mesh, type Raycaster } from 'three';
import type { TileData } from './protocol';

// Elección rápida con el puntero: en vez de probar los miles de triángulos de la tesela, se prueba
// primero la caja de cada edificio y solo los triángulos de los edificios cuya caja cruza el rayo
// (y que podrían quedar más cerca que lo ya encontrado). Devuelve lo mismo que Mesh.raycast.

const inverse = new Matrix4();
const ray = new Ray();
const box = new Box3();
const entry = new Vector3();
const [a, b, c, point, nearest] = [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];

const vertex = (tile: TileData, i: number, out: Vector3) => {
  const v = tile.index[i] ?? 0;
  return out.set(tile.position[3 * v] ?? 0, tile.position[3 * v + 1] ?? 0, tile.position[3 * v + 2] ?? 0);
};

/** Primer índice de la cara más cercana que cruza `ray` (en coordenadas de la tesela), o −1. */
function nearestFace(tile: TileData, local: Ray): number {
  let best = Infinity;
  let face = -1;
  for (let k = 0; k < tile.buildings.length; k++) {
    box.min.fromArray(tile.boxes, 6 * k);
    box.max.fromArray(tile.boxes, 6 * k + 3);
    if (!local.intersectBox(box, entry)) continue;
    if (!box.containsPoint(local.origin) && local.origin.distanceTo(entry) >= best) continue;
    for (let i = tile.ranges[k] ?? 0; i < (tile.ranges[k + 1] ?? 0); i += 3) {
      if (!local.intersectTriangle(vertex(tile, i, a), vertex(tile, i + 1, b), vertex(tile, i + 2, c), false, point)) continue;
      const distance = local.origin.distanceTo(point);
      if (distance >= best) continue;
      best = distance;
      face = i;
      nearest.copy(point);
    }
  }
  return face;
}

/** Función `raycast` para la malla de una tesela (se asigna a `mesh.raycast`). */
export function tileRaycast(tile: TileData) {
  const bounds = new Box3().setFromArray(tile.bounds);
  return function raycast(this: Mesh, raycaster: Raycaster, intersects: Intersection[]): void {
    inverse.copy(this.matrixWorld).invert();
    ray.copy(raycaster.ray).applyMatrix4(inverse);
    if (!ray.intersectsBox(bounds)) return;
    const first = nearestFace(tile, ray);
    if (first < 0) return;
    const hit = nearest.clone().applyMatrix4(this.matrixWorld);
    const distance = raycaster.ray.origin.distanceTo(hit);
    if (distance < raycaster.near || distance > raycaster.far) return;
    const [ia, ib, ic] = [tile.index[first] ?? 0, tile.index[first + 1] ?? 0, tile.index[first + 2] ?? 0];
    const normal = Triangle.getNormal(vertex(tile, first, a), vertex(tile, first + 1, b), vertex(tile, first + 2, c), new Vector3());
    intersects.push({ distance, point: hit, object: this, faceIndex: first / 3, face: { a: ia, b: ib, c: ic, normal, materialIndex: 0 } });
  };
}
