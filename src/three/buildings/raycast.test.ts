import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { buildAll } from './builder';
import { fakeSource, square } from './fixture';
import { tileRaycast } from './raycast';
import { buildingOfFace, tileGeometry } from './tileGeometry';
import { LEVEL_HEIGHT } from './volume';

// Tres edificios en fila sobre el eje x: 0 (2 pisos), 1 (6 pisos, más alto) y 2 (1 piso).
const source = fakeSource([
  { rings: [square(0, 0, 10)], pisos: 2 },
  { rings: [square(20, 0, 10)], pisos: 6 },
  { rings: [square(40, 0, 10)], pisos: 1 },
]);
const [tile] = buildAll(source).tiles;
if (!tile) throw new Error('sin tesela');
const mesh = new Mesh(tileGeometry(tile), new MeshBasicMaterial());
mesh.raycast = tileRaycast(tile);
mesh.updateMatrixWorld();

function pick(origin: Vector3, direction: Vector3) {
  const raycaster = new Raycaster(origin, direction.normalize());
  const [hit] = raycaster.intersectObject(mesh);
  return hit ? { building: buildingOfFace(mesh.geometry, hit.face), distance: hit.distance, faceIndex: hit.faceIndex } : null;
}

describe('elegir un edificio con el rayo del puntero', () => {
  it('la geometría trae caja y esfera de la tesela (recorte por frustum sin recalcular)', () => {
    const g = tileGeometry(tile);
    expect(g.boundingBox?.max.y).toBeCloseTo(6 * LEVEL_HEIGHT);
    expect(g.boundingSphere?.radius).toBeGreaterThan(25);
    expect(g.getAttribute('aData').itemSize).toBe(3);
  });

  it('desde arriba da el edificio cuyo techo está debajo', () => {
    expect(pick(new Vector3(5, 500, -5), new Vector3(0, -1, 0))?.building).toBe(0);
    expect(pick(new Vector3(45, 500, -5), new Vector3(0, -1, 0))?.building).toBe(2);
    expect(pick(new Vector3(15, 500, -5), new Vector3(0, -1, 0))).toBeNull(); // calle entre 0 y 1
  });

  it('en diagonal se queda con el más cercano: el alto tapa al bajo de atrás', () => {
    // Desde el oeste y arriba hacia el edificio 2: el 1 (alto) se cruza antes.
    const hit = pick(new Vector3(-30, 60, -5), new Vector3(75, -59, 0));
    expect(hit?.building).toBe(1);
  });

  it('cada cara de la tesela da el edificio de su rango', () => {
    for (let k = 0; k < tile.buildings.length; k++) {
      for (let i = tile.ranges[k] ?? 0; i < (tile.ranges[k + 1] ?? 0); i += 3) {
        const face = { a: tile.index[i] ?? 0, b: 0, c: 0 };
        expect(buildingOfFace(mesh.geometry, face)).toBe(tile.buildings[k]);
      }
    }
    expect(buildingOfFace(mesh.geometry, null)).toBeNull();
  });

  it('respeta near y far del raycaster', () => {
    const raycaster = new Raycaster(new Vector3(5, 500, -5), new Vector3(0, -1, 0), 0, 100);
    expect(raycaster.intersectObject(mesh)).toEqual([]);
  });
});
