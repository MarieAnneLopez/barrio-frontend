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
 * Ejes viales como cintas: las principales oscuras con filo activo azul
 * (una cinta azul más ancha debajo) y la red local como trazo tenue.
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
        <meshBasicMaterial color={colors.realce} side={DoubleSide} transparent opacity={0.85} />
      </mesh>
      <mesh geometry={geometries.core}>
        <meshBasicMaterial color={colors.fondo} side={DoubleSide} />
      </mesh>
      <mesh geometry={geometries.local}>
        <meshBasicMaterial color={colors.linea} side={DoubleSide} transparent opacity={0.28} />
      </mesh>
    </group>
  );
}
