import { useFrame, useLoader } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { DoubleSide, Object3D, SRGBColorSpace, TextureLoader, type Group, type InstancedMesh } from 'three';
import { cloudField } from './cloudField';

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
  const texture = useLoader(TextureLoader, '/assets/night-cloud.webp');
  const mesh = useRef<InstancedMesh>(null);
  const group = useRef<Group>(null);

  useLayoutEffect(() => {
    const target = mesh.current;
    if (!target) return;
    const dummy = new Object3D();
    clouds.forEach((cloud, i) => {
      dummy.position.set(cloud.x - cx, cloud.y, cloud.z - cz);
      dummy.rotation.set(-1.17, cloud.turn, 0, 'YXZ');
      dummy.scale.set(2.5 * cloud.size, cloud.size, 1);
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
      <instancedMesh ref={mesh} args={[undefined, undefined, clouds.length]} frustumCulled={false} raycast={() => null}>
        <planeGeometry />
        <meshBasicMaterial map={texture} map-colorSpace={SRGBColorSpace} side={DoubleSide} transparent opacity={0.53} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
