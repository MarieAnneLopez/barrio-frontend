import type { Feature } from 'geojson';
import { useEffect, useMemo } from 'react';
import { DoubleSide } from 'three';
import { buildRibbons } from './ribbons';
import type { Projection } from './projection';
import { PATH_Y, STREET_Y } from './referenceView';
import type { SceneColors } from './sceneColors';

const kindOf = (f: Feature) => String((f.properties as { kind?: string } | null)?.kind);
const MAJOR = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary']);
/** Vías internas y senderos: el 52 % de las «service» va dentro de manzanas, así que van sobre el zócalo. */
const PATHS = new Set(['service', 'footway', 'cycleway', 'path', 'pedestrian', 'steps', 'track']);

interface Props {
  features: readonly Feature[];
  project: Projection;
  colors: SceneColors;
}

/**
 * Vías como cintas opacas del tema (D83): las principales claras con borde gris, las calles
 * claras a ras del suelo (ninguna cruza una manzana: quedan entre los zócalos) y los senderos y
 * vías internas en gris sobre las manzanas. Sin transparencias: el color no se mezcla.
 */
export function RoadsLayer({ features, project, colors }: Props) {
  const geometries = useMemo(() => {
    const major = features.filter((f) => MAJOR.has(kindOf(f)));
    const paths = features.filter((f) => PATHS.has(kindOf(f)));
    const streets = features.filter((f) => !MAJOR.has(kindOf(f)) && !PATHS.has(kindOf(f)));
    return {
      edge: buildRibbons(major, project, () => 18, STREET_Y),
      core: buildRibbons(major, project, () => 13, STREET_Y + 0.1),
      streets: buildRibbons(streets, project, () => 8, STREET_Y + 0.05),
      paths: buildRibbons(paths, project, (f) => (kindOf(f) === 'service' ? 4 : 2.5), PATH_Y),
    };
  }, [features, project]);
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries]);

  return (
    <group>
      <mesh geometry={geometries.edge}>
        <meshBasicMaterial color={colors.viaBorde} side={DoubleSide} />
      </mesh>
      <mesh geometry={geometries.core}>
        <meshBasicMaterial color={colors.via} side={DoubleSide} />
      </mesh>
      <mesh geometry={geometries.streets}>
        <meshBasicMaterial color={colors.via} side={DoubleSide} />
      </mesh>
      <mesh geometry={geometries.paths}>
        <meshBasicMaterial color={colors.viaBorde} side={DoubleSide} />
      </mesh>
    </group>
  );
}
