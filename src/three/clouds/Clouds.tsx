import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Color, IcosahedronGeometry, Object3D, type Group, type InstancedMesh } from 'three';
import { mapColor } from '../../lib/cssToken';
import { CLOUD_HALF_HEIGHT, cloudField } from './cloudField';

/** Nube de 5 bolas bajas y achatadas, de radio ≈ 1 y medio alto ≤ CLOUD_HALF_HEIGHT. */
function puffGeometry() {
  const balls: Array<[number, number, number, number]> = [
    [0, 0, 0, 0.62], [0.55, -0.05, 0.1, 0.45], [-0.55, -0.08, -0.05, 0.42], [0.15, 0.12, -0.4, 0.4], [-0.2, 0.05, 0.42, 0.38],
  ];
  const parts = balls.map(([x, y, z, r]) => {
    const g = new IcosahedronGeometry(r, 1);
    g.scale(1, 0.62, 1);
    g.translate(x, y, z);
    return g;
  });
  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  merged.computeBoundingBox();
  // Asegura el contrato de cloudField: nada de la nube pasa de su medio alto sobre el centro.
  const top = merged.boundingBox?.max.y ?? CLOUD_HALF_HEIGHT;
  if (top > CLOUD_HALF_HEIGHT) merged.scale(1, CLOUD_HALF_HEIGHT / top, 1);
  return merged;
}

interface Props {
  center: [number, number];
  radius: number;
  count: number;
  still: boolean;
}

/** Nubes bajo y alrededor de la isla (cloudField.ts): giran despacio alrededor del barrio. */
export function Clouds({ center, radius, count, still }: Props) {
  const [cx, cz] = center;
  const clouds = useMemo(() => cloudField(cx, cz, radius, count), [cx, cz, radius, count]);
  const geometry = useMemo(() => puffGeometry(), []);
  const color = useMemo(() => new Color(mapColor('ciclo-nube')), []);
  const mesh = useRef<InstancedMesh>(null);
  const group = useRef<Group>(null);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useLayoutEffect(() => {
    const target = mesh.current;
    if (!target) return;
    const dummy = new Object3D();
    clouds.forEach((cloud, i) => {
      dummy.position.set(cloud.x - cx, cloud.y, cloud.z - cz);
      dummy.rotation.set(0, cloud.turn, 0);
      dummy.scale.setScalar(cloud.size);
      dummy.updateMatrix();
      target.setMatrixAt(i, dummy.matrix);
    });
    target.instanceMatrix.needsUpdate = true;
    target.computeBoundingSphere();
  }, [clouds, cx, cz]);

  // Una vuelta cada 40 min: se nota que el cielo vive, sin distraer.
  useFrame((_, delta) => {
    if (!still && group.current) group.current.rotation.y += Math.min(delta, 0.1) * ((Math.PI * 2) / 2400);
  });

  return (
    <group ref={group} position={[cx, 0, cz]}>
      <instancedMesh ref={mesh} args={[geometry, undefined, clouds.length]} frustumCulled={false}>
        <meshLambertMaterial color={color} flatShading />
      </instancedMesh>
    </group>
  );
}
