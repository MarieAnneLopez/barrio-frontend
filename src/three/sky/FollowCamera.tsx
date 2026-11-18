import { useFrame } from '@react-three/fiber';
import { useRef, type ReactNode } from 'react';
import type { Group } from 'three';

/**
 * Lo que va en el infinito (cúpula del cielo, sol y luna) viaja con la cámara, como una caja de
 * cielo: la cámara nunca sale de la cúpula al alejarse y el sol no cambia de tamaño ni de lugar al
 * moverse por la maqueta. Solo se copia la posición; la dirección de cada cosa es la del ciclo.
 */
export function FollowCamera({ children }: { children: ReactNode }) {
  const group = useRef<Group>(null);
  useFrame(({ camera }) => {
    group.current?.position.copy(camera.position);
  }, -1); // antes que el resto del cuadro
  return <group ref={group}>{children}</group>;
}
