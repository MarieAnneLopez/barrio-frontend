import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Float32BufferAttribute, type Points } from 'three';
import type { SceneColors } from './sceneColors';

const COUNT = 420;

interface Props {
  size: [number, number];
  colors: SceneColors;
  still: boolean;
}

/** Partículas atmosféricas sutiles: una sola nube de puntos que gira muy despacio. */
export function Particles({ size, colors, still }: Props) {
  const ref = useRef<Points>(null);
  const geometry = useMemo(() => {
    // Generador determinista: la nube es la misma en cada visita (sin Math.random).
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const values = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      values.set([(rand() - 0.5) * size[0] * 1.3, 40 + rand() * 360, (rand() - 0.5) * size[1] * 1.3], i * 3);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(values, 3));
    return g;
  }, [size]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (still || !ref.current) return;
    ref.current.rotation.y += delta * 0.01;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 6;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color={colors.sky} size={2.2} sizeAttenuation={false} transparent opacity={0.45} depthWrite={false} />
    </points>
  );
}
