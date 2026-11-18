import { useEffect, useMemo } from 'react';
import { Color, DoubleSide } from 'three';
import { mapColor } from '../../lib/cssToken';
import { islandGeometry } from './islandGeometry';

interface Props {
  /** Borde del barrio en metros, [x0, z0, x1, z1, …] (anillo exterior del área «barrio» del suelo). */
  outline: ArrayLike<number>;
}

/**
 * La maqueta flota en el cielo sobre una isla (gran actualización): banda de tierra bajo el borde
 * del barrio y roca que se afina hacia abajo. La iluminan el sol y la luna (SkyDriver).
 */
export function Island({ outline }: Props) {
  const geometry = useMemo(
    () => islandGeometry(outline, new Color(mapColor('ciclo-tierra')), new Color(mapColor('ciclo-roca'))),
    [outline],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshLambertMaterial vertexColors flatShading side={DoubleSide} />
    </mesh>
  );
}
