import type { ThreeEvent } from '@react-three/fiber';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { useEffect, useMemo, useRef } from 'react';
import { EdgesGeometry } from 'three';
import { extrudeFeatures } from './extrude';
import { useHeroStore } from './heroStore';
import { footprintArea, levelsOf, METERS_PER_LEVEL } from './metrics';
import type { Projection } from './projection';
import { EXAGGERATION } from './referenceView';
import { heightClass, type SceneColors } from './sceneColors';
import { paintFaces } from './toon';

type Building = Feature<Polygon | MultiPolygon>;

/** Altura dibujada: pisos de OSM × 3,2 m × exageración vertical medida en la referencia (D83). */
const heightOf = (f: Pick<Feature, 'properties'>) => levelsOf(f) * METERS_PER_LEVEL * EXAGGERATION;
const highlightHeight = (f: Pick<Feature, 'properties'>) => heightOf(f) + 0.6;

interface Props {
  features: readonly Building[];
  project: Projection;
  colors: SceneColors;
}

/** Edificios OSM extruidos por sus pisos reales: una malla, aristas y resalte al hover. */
export function BuildingsLayer({ features, project, colors }: Props) {
  const geometry = useMemo(() => {
    const merged = extrudeFeatures(features, project, heightOf);
    // Techo por clase de altura; la cara iluminada va un tono más clara y la otra en sombra.
    paintFaces(merged, (kind, id) => {
      const feature = features[id];
      const cls = feature ? heightClass(levelsOf(feature)) : 0;
      if (kind === 'shadow') return colors.sombra;
      return colors.edificio[kind === 'top' ? cls : cls === 2 ? 1 : cls + 1] ?? colors.edificio[0];
    });
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
        <meshBasicMaterial vertexColors />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={colors.contorno} transparent opacity={0.5} />
      </lineSegments>
      {highlight ? (
        <mesh geometry={highlight}>
          <meshBasicMaterial color={colors.contorno} transparent opacity={0.9} />
        </mesh>
      ) : null}
    </group>
  );
}
