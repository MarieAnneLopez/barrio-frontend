import type { ThreeEvent } from '@react-three/fiber';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { useEffect, useMemo, useRef } from 'react';
import { EdgesGeometry, Float32BufferAttribute, type BufferGeometry } from 'three';
import { extrudeFeatures } from './extrude';
import { useHeroStore } from './heroStore';
import { footprintArea, levelsOf, METERS_PER_LEVEL } from './metrics';
import type { Projection } from './projection';
import type { SceneColors } from './sceneColors';

type Building = Feature<Polygon | MultiPolygon>;

const heightOf = (f: Pick<Feature, 'properties'>) => levelsOf(f) * METERS_PER_LEVEL;
const highlightHeight = (f: Pick<Feature, 'properties'>) => heightOf(f) + 0.6;

/** Degradado navy → cobalt según la altura (ref. visual 1). */
function paintByHeight(geometry: BufferGeometry, colors: SceneColors): void {
  const position = geometry.getAttribute('position');
  if (!position) return;
  geometry.computeBoundingBox();
  const top = Math.max(1, geometry.boundingBox?.max.y ?? 1);
  const values = new Float32Array(position.count * 3);
  const mix = colors.base.clone();
  for (let i = 0; i < position.count; i++) {
    mix.copy(colors.base).lerp(colors.alto, Math.min(1, position.getY(i) / top));
    values.set([mix.r, mix.g, mix.b], i * 3);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(values, 3));
}

interface Props {
  features: readonly Building[];
  project: Projection;
  colors: SceneColors;
}

/** Edificios OSM extruidos por sus pisos reales: una malla, aristas y resalte al hover. */
export function BuildingsLayer({ features, project, colors }: Props) {
  const geometry = useMemo(() => {
    const merged = extrudeFeatures(features, project, heightOf);
    paintByHeight(merged, colors);
    return merged;
  }, [features, project, colors]);
  const edges = useMemo(() => new EdgesGeometry(geometry, 25), [geometry]);
  useEffect(() => () => { geometry.dispose(); edges.dispose(); }, [geometry, edges]);

  const hovered = useHeroStore((s) => s.hovered);
  const setHovered = useHeroStore((s) => s.setHovered);
  const highlight = useMemo(() => {
    const feature = hovered ? features[hovered.index] : undefined;
    return feature ? extrudeFeatures([feature], project, highlightHeight) : null;
  }, [hovered, features, project]);
  useEffect(() => () => highlight?.dispose(), [highlight]);
  const last = useRef(-1);

  const onMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const vertex = event.face?.a;
    if (vertex === undefined) return;
    const index = geometry.getAttribute('featureId').getX(vertex);
    if (index === last.current) return;
    last.current = index;
    const feature = features[index];
    if (!feature) return;
    const kind = (feature.properties as { kind?: string | null } | null)?.kind ?? null;
    setHovered({ index, kind, levels: levelsOf(feature), areaM2: footprintArea(feature, project) });
  };
  const onOut = () => {
    last.current = -1;
    setHovered(null);
  };

  return (
    <group>
      <mesh geometry={geometry} onPointerMove={onMove} onPointerOut={onOut}>
        <meshStandardMaterial vertexColors roughness={0.55} metalness={0.15} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={colors.linea} transparent opacity={0.55} />
      </lineSegments>
      {highlight ? (
        <mesh geometry={highlight}>
          <meshStandardMaterial color={colors.realce} emissive={colors.realce} emissiveIntensity={0.6} transparent opacity={0.85} />
        </mesh>
      ) : null}
    </group>
  );
}
