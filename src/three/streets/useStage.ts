import { useFrame } from '@react-three/fiber';
import { useState } from 'react';

/**
 * Etapa de montaje que avanza una por cuadro hasta `last`: las capas se arman de a una y ninguna
 * tarea larga bloquea el hilo principal al abrir la maqueta (meta: nada de más de 50 ms).
 */
export function useStage(last: number): number {
  const [stage, setStage] = useState(0);
  useFrame(() => {
    if (stage < last) setStage(stage + 1);
  });
  return stage;
}
