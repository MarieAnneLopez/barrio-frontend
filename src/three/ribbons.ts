// Vías GeoJSON → cintas planas (dos triángulos por tramo) en una sola geometría.
import type { Feature } from 'geojson';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { Projection } from './projection';

function lines(feature: Feature): number[][][] {
  const geometry = feature.geometry;
  if (geometry?.type === 'LineString') return [geometry.coordinates];
  if (geometry?.type === 'MultiLineString') return geometry.coordinates;
  return [];
}

export function buildRibbons(
  features: readonly Feature[],
  project: Projection,
  widthOf: (feature: Feature) => number,
  y: number,
): BufferGeometry {
  const positions: number[] = [];
  for (const feature of features) {
    const half = widthOf(feature) / 2;
    for (const line of lines(feature)) {
      for (let i = 0; i < line.length - 1; i++) {
        const [ax, az] = project(line[i] ?? []);
        const [bx, bz] = project(line[i + 1] ?? []);
        const length = Math.hypot(bx - ax, bz - az);
        if (length === 0) continue;
        // Normal del tramo en el plano XZ, escalada a medio ancho.
        const nx = (-(bz - az) / length) * half;
        const nz = ((bx - ax) / length) * half;
        positions.push(
          ax + nx, y, az + nz, bx + nx, y, bz + nz, ax - nx, y, az - nz,
          ax - nx, y, az - nz, bx + nx, y, bz + nz, bx - nx, y, bz - nz,
        );
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}
