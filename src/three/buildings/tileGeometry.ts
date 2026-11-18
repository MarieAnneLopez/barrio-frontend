import { Box3, BufferAttribute, BufferGeometry, Sphere, Vector3 } from 'three';
import type { TileData } from './protocol';

/**
 * BufferGeometry de una tesela sobre sus arreglos (sin copiarlos): posición, `aData` (edificio,
 * columna, remate) e índices. La caja y la esfera vienen del worker: three recorta por frustum sin
 * recorrer los vértices en el hilo principal.
 */
export function tileGeometry(tile: TileData): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(tile.position, 3));
  geometry.setAttribute('aData', new BufferAttribute(tile.data, 3));
  geometry.setIndex(new BufferAttribute(tile.index, 1));
  const [x0 = 0, y0 = 0, z0 = 0, x1 = 0, y1 = 0, z1 = 0] = tile.bounds;
  geometry.boundingBox = new Box3(new Vector3(x0, y0, z0), new Vector3(x1, y1, z1));
  geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(new Sphere());
  return geometry;
}

/** Edificio de una cara (por su primer vértice y el atributo `aData`); null si no hay cara. */
export function buildingOfFace(geometry: BufferGeometry, face: { a: number } | null | undefined): number | null {
  const data = geometry.getAttribute('aData');
  if (!face || !data || face.a >= data.count) return null;
  return Math.round(data.getX(face.a));
}
