// Polígonos GeoJSON → una sola BufferGeometry extruida (una draw call por capa).
// Cada vértice guarda `featureId` para saber qué edificio está bajo el puntero.
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Shape, Vector2 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Projection } from './projection';

type AreaFeature = Feature<Polygon | MultiPolygon | null>;

function polygons(feature: AreaFeature): number[][][][] {
  const geometry = feature.geometry;
  if (!geometry) return [];
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
}

function toShape(rings: number[][][], project: Projection): Shape | null {
  const [outer, ...holes] = rings;
  if (!outer || outer.length < 4) return null;
  // El plano XY de la Shape se rota luego a XZ: y de la Shape = -z (norte arriba).
  const toVec = (p: number[]) => {
    const [x, z] = project(p);
    return new Vector2(x, -z);
  };
  const shape = new Shape(outer.map(toVec));
  for (const hole of holes) if (hole.length >= 4) shape.holes.push(new Shape(hole.map(toVec)));
  return shape;
}

export function extrudeFeatures(
  features: readonly AreaFeature[],
  project: Projection,
  heightOf: (feature: AreaFeature) => number,
): BufferGeometry {
  const parts: BufferGeometry[] = [];
  features.forEach((feature, id) => {
    const depth = Math.max(0.5, heightOf(feature));
    for (const rings of polygons(feature)) {
      const shape = toShape(rings, project);
      if (!shape) continue;
      const part = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
      part.rotateX(-Math.PI / 2); // extruir hacia +y (arriba)
      const count = part.getAttribute('position').count;
      part.setAttribute('featureId', new Float32BufferAttribute(new Float32Array(count).fill(id), 1));
      parts.push(part.index ? part.toNonIndexed() : part);
      part.dispose();
    }
  });
  if (parts.length === 0) return new BufferGeometry();
  const merged = mergeGeometries(parts, false) ?? new BufferGeometry();
  parts.forEach((part) => part.dispose());
  return merged;
}

export function triangleCount(geometry: BufferGeometry): number {
  const position = geometry.getAttribute('position');
  if (!position) return 0;
  return (geometry.index ? geometry.index.count : position.count) / 3;
}
