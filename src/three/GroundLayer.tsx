import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { useEffect, useMemo } from 'react';
import type { BaseMapData } from '../components/map/baseMapData';
import { extrudeFeatures } from './extrude';
import type { Projection } from './projection';
import type { SceneColors } from './sceneColors';

type Area = Feature<Polygon | MultiPolygon>;

interface Props {
  base: BaseMapData;
  project: Projection;
  colors: SceneColors;
}

/**
 * Suelo de El Tintal: la huella del polígono, las manzanas residenciales como
 * zócalos bajos (OSM no trae su altura) y los parques apenas levantados.
 */
export function GroundLayer({ base, project, colors }: Props) {
  const footprint = useMemo(
    () => extrudeFeatures([base.polygon as unknown as Area], project, () => 0.5),
    [base, project],
  );
  const blocks = useMemo(
    () => extrudeFeatures(base.layers.manzanas.features as Area[], project, () => 2),
    [base, project],
  );
  const parks = useMemo(
    () => extrudeFeatures(base.layers.parques.features as Area[], project, () => 1.2),
    [base, project],
  );
  useEffect(
    () => () => [footprint, blocks, parks].forEach((g) => g.dispose()),
    [footprint, blocks, parks],
  );

  return (
    <group>
      <mesh geometry={footprint} position-y={-0.6}>
        <meshStandardMaterial color={colors.navy} roughness={0.95} />
      </mesh>
      <mesh geometry={blocks}>
        <meshStandardMaterial color={colors.navy} emissive={colors.cobalt} emissiveIntensity={0.08} roughness={0.8} />
      </mesh>
      <mesh geometry={parks}>
        <meshStandardMaterial color={colors.azure} transparent opacity={0.32} roughness={1} />
      </mesh>
    </group>
  );
}
