import type { Feature } from 'geojson';
import { useEffect, useMemo } from 'react';
import { DoubleSide } from 'three';
import { buildRibbons } from './ribbons';
import type { Projection } from './projection';
import type { SceneColors } from './sceneColors';

const MAJOR = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary']);
const isMajor = (f: Feature) => MAJOR.has(String((f.properties as { kind?: string } | null)?.kind));

interface Props {
  features: readonly Feature[];
  project: Projection;
  colors: SceneColors;
}

/**
 * Ejes viales como cintas claras (D82): las principales blancas con filo verde
 * (una cinta más ancha debajo) y la red local blanca y más fina.
 */
export function RoadsLayer({ features, project, colors }: Props) {
  const geometries = useMemo(() => {
    const major = features.filter(isMajor);
    const minor = features.filter((f) => !isMajor(f));
    return {
      edge: buildRibbons(major, project, () => 18, 2.6),
      core: buildRibbons(major, project, () => 13, 2.7),
      local: buildRibbons(minor, project, () => 4, 2.6),
    };
  }, [features, project]);
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries]);

  return (
    <group>
      <mesh geometry={geometries.edge}>
        <meshBasicMaterial color={colors.filo} side={DoubleSide} transparent opacity={0.7} />
      </mesh>
      <mesh geometry={geometries.core}>
        <meshBasicMaterial color={colors.via} side={DoubleSide} />
      </mesh>
      <mesh geometry={geometries.local}>
        <meshBasicMaterial color={colors.via} side={DoubleSide} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}
