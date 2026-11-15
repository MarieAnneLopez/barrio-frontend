import { MapControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MathUtils, TOUCH, Vector3 } from 'three';
import type { MapControls as MapControlsImpl } from 'three-stdlib';
import { useHeroStore } from './heroStore';

const AUTO_ROTATE_SPEED = 0.33; // unidades de three: ~una vuelta cada 3 minutos
const EASE = 3; // ease-out exponencial: ~95 % del recorrido en ~1 s
const NO_GESTURE = -1 as TOUCH; // un dedo no mueve la maqueta: desplaza la página

function homePosition(radius: number): Vector3 {
  const [az, el] = [0.6, 0.62];
  return new Vector3(radius * Math.cos(el) * Math.sin(az), radius * Math.sin(el), radius * Math.cos(el) * Math.cos(az));
}

interface Props {
  radius: number;
  reducedMotion: boolean;
}

/**
 * Cámara de la maqueta (H34): arrastrar mueve (botón derecho gira), rueda y pellizco
 * acercan sin límite fijo de pasos; en táctil un dedo deja pasar el scroll de la página
 * y dos dedos manejan la maqueta. Órbita automática pausable, vuelo hacia el lugar
 * elegido y botón de recentrar. Movimiento reducido: sin órbita y saltos directos.
 */
export function CameraRig({ radius, reducedMotion }: Props) {
  const controls = useRef<MapControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const goal = useRef<{ target: Vector3; position: Vector3 } | null>(null);
  const placed = useRef(false);
  const paused = useHeroStore((s) => s.paused);
  const interacting = useHeroStore((s) => s.interacting);
  const selected = useHeroStore((s) => s.selected);
  const recenterTick = useHeroStore((s) => s.recenterTick);

  // Vuelo hacia el lugar elegido o de vuelta al encuadre inicial (recentrar).
  useEffect(() => {
    if (selected) {
      const target = new Vector3(...selected.position);
      const away = camera.position.clone().sub(controls.current?.target ?? new Vector3()).setLength(radius * 0.28);
      goal.current = { target, position: target.clone().add(away) };
    } else {
      goal.current = { target: new Vector3(), position: homePosition(radius) };
    }
  }, [selected, recenterTick, camera, radius]);

  useFrame((state, delta) => {
    // MapControls pone touch-action: none en el elemento de eventos de r3f y en el canvas
    // (atrapan el scroll); pan-y lo devuelve a la página: un dedo baja, dos manejan la maqueta.
    const surfaces = [state.gl.domElement, state.events.connected as HTMLElement | undefined];
    for (const el of surfaces) if (el && el.style.touchAction !== 'pan-y') el.style.touchAction = 'pan-y';
    if (!placed.current) {
      state.camera.position.copy(homePosition(radius));
      placed.current = true;
    }
    const c = controls.current;
    const g = goal.current;
    if (!c || !g) return;
    const k = reducedMotion ? 1 : 1 - Math.exp(-EASE * delta);
    c.target.lerp(g.target, k);
    camera.position.lerp(g.position, k);
    if (c.target.distanceTo(g.target) < 0.5 && camera.position.distanceTo(g.position) < 0.5) goal.current = null;
  });

  return (
    <MapControls
      ref={controls}
      makeDefault
      enableDamping={!reducedMotion}
      autoRotate={!reducedMotion && !paused && !interacting && !selected}
      autoRotateSpeed={AUTO_ROTATE_SPEED}
      minDistance={radius * 0.12}
      maxDistance={radius * 1.8}
      maxPolarAngle={MathUtils.degToRad(78)}
      touches={{ ONE: NO_GESTURE, TWO: TOUCH.DOLLY_ROTATE }}
      onStart={() => {
        goal.current = null; // el usuario manda: se interrumpe el vuelo
      }}
    />
  );
}
