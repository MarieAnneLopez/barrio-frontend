import { useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Vector3 } from 'three';
import type { MapControls as MapControlsImpl } from 'three-stdlib';
import { watchDrags } from './dragWatchdog';

/**
 * Que la cámara del mapa nunca quede sorda (pedido de Martín): si un arrastre del ratón no mueve nada
 * (dragWatchdog), devuelve un número nuevo que sirve de `key` de los controles. Se rehacen limpios
 * (sin puntero viejo ni oyentes perdidos) y el objetivo vuelve donde estaba; la cámara no se mueve.
 */
export function useControlsGuard(controls: RefObject<MapControlsImpl | null>): number {
  const canvas = useThree((s) => s.gl.domElement);
  const camera = useThree((s) => s.camera);
  const [epoch, setEpoch] = useState(0);
  const target = useRef<Vector3 | null>(null);

  useEffect(
    () =>
      watchDrags(
        canvas,
        () => (controls.current ? [...camera.position.toArray(), ...controls.current.target.toArray()] : []),
        () => {
          target.current = controls.current?.target.clone() ?? null;
          setEpoch((n) => n + 1);
        },
      ),
    [canvas, camera, controls],
  );

  useEffect(() => {
    if (!target.current || !controls.current) return;
    controls.current.target.copy(target.current);
    controls.current.update();
    target.current = null;
  }, [epoch, controls]);

  return epoch;
}
