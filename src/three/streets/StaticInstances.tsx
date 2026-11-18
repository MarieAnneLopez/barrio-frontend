import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { InstancedBufferAttribute, InstancedMesh, type BufferGeometry, type Material } from 'three';
import { LIGHT } from '../sky/lightUniforms';

interface Props {
  geometry: BufferGeometry;
  material: Material;
  /** 16 floats por instancia (posesToMatrices, marksToMatrices). */
  matrices: Float32Array;
  /** rgb por instancia (multiplica las partes con tinte), opcional. */
  colors?: Float32Array | undefined;
  /** Solo se dibuja de noche (halos de luz): de día no gasta relleno. */
  nightOnly?: boolean;
}

/** Malla instanciada fija (árboles, faroles, semáforos, cebras): un dibujo para todas. */
export function StaticInstances({ geometry, material, matrices, colors, nightOnly = false }: Props) {
  const mesh = useMemo(() => {
    const count = matrices.length / 16;
    const m = new InstancedMesh(geometry, material, Math.max(1, count));
    m.instanceMatrix = new InstancedBufferAttribute(matrices.length ? matrices : new Float32Array(16), 16);
    if (colors) m.instanceColor = new InstancedBufferAttribute(colors, 3);
    m.count = count;
    m.computeBoundingSphere();
    return m;
  }, [geometry, material, matrices, colors]);
  const ref = useRef<InstancedMesh>(null);
  useEffect(() => () => {
    mesh.dispose();
  }, [mesh]);
  useFrame(() => {
    if (nightOnly && ref.current) ref.current.visible = LIGHT.uNight.value > 0.01;
  });
  return <primitive ref={ref} object={mesh} />;
}
