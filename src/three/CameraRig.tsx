import { MapControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { MathUtils, TOUCH, Vector3, type Fog, type PerspectiveCamera } from 'three';
import type { MapControls as MapControlsImpl } from 'three-stdlib';
import { useHeroStore } from './heroStore';
import { homeView } from './referenceView';

const AUTO_ROTATE_SPEED = 0.33; // unidades de three: ~una vuelta cada 3 minutos
const EASE = 3; // ease-out exponencial: ~95 % del recorrido en ~1 s
const NO_GESTURE = -1 as TOUCH; // un dedo no mueve la maqueta: desplaza la página

interface Props {
  radius: number;
  /** Malla vial, zona con más edificios y manzana mediana (de los datos): definen el encuadre. */
  view: { grid: number; spot: readonly [number, number]; blockSize: number };
  reducedMotion: boolean;
}

/**
 * Cámara de la maqueta (H34, D83): encuadre inicial con la inclinación, el giro y las calles por
 * ancho medidos en la referencia. Arrastrar mueve (botón derecho gira), rueda y pellizco acercan;
 * en táctil un dedo deja pasar el scroll y dos manejan la maqueta. Órbita pausable, vuelo hacia
 * el lugar elegido y recentrar. Movimiento reducido: sin órbita y saltos directos.
 */
export function CameraRig({ radius, view, reducedMotion }: Props) {
  const controls = useRef<MapControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const home = useMemo(() => homeView(view.grid, view.spot, view.blockSize, aspect), [view, aspect]);
  const goal = useRef<{ target: Vector3; position: Vector3 } | null>(null);
  const placed = useRef(false);
  const paused = useHeroStore((s) => s.paused);
  const interacting = useHeroStore((s) => s.interacting);
  const selected = useHeroStore((s) => s.selected);
  const recenterTick = useHeroStore((s) => s.recenterTick);

  // Vuelo hacia el lugar elegido o de vuelta al encuadre inicial (recentrar).
  useEffect(() => {
    if (selected) {
      const target = new Vector3(...selected.position).setY(0);
      const away = camera.position.clone().sub(controls.current?.target ?? home.target).setLength(home.distance * 0.45);
      goal.current = { target, position: target.clone().add(away) };
    } else {
      goal.current = { target: home.target.clone(), position: home.position.clone() };
    }
  }, [selected, recenterTick, camera, home]);

  useFrame((state, delta) => {
    // MapControls pone touch-action: none en el elemento de eventos de r3f y en el canvas
    // (atrapan el scroll); pan-y lo devuelve a la página: un dedo baja, dos manejan la maqueta.
    const surfaces = [state.gl.domElement, state.events.connected as HTMLElement | undefined];
    for (const el of surfaces) if (el && el.style.touchAction !== 'pan-y') el.style.touchAction = 'pan-y';
    const c = controls.current;
    if (!c) return;
    if (!placed.current) {
      state.camera.position.copy(home.position);
      c.target.copy(home.target);
      placed.current = true;
    }
    // Recorte y niebla relativos a la distancia: con el plano cercano a media distancia las capas
    // a ras de suelo no parpadean, y la niebla da ≈ 15 % al fondo del encuadre (como la referencia).
    const distance = state.camera.position.distanceTo(c.target);
    const lens = state.camera as PerspectiveCamera;
    if (Math.abs(lens.near - distance * 0.5) > distance * 0.02) {
      [lens.near, lens.far] = [distance * 0.5, distance * 2.2];
      lens.updateProjectionMatrix();
    }
    const fog = state.scene.fog as Fog | null;
    if (fog) [fog.near, fog.far] = [distance * 0.95, distance * 2.2];
    const g = goal.current;
    if (!g) return;
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
      minDistance={home.distance * 0.25}
      maxDistance={radius * 4.5}
      maxPolarAngle={MathUtils.degToRad(78)}
      touches={{ ONE: NO_GESTURE, TWO: TOUCH.DOLLY_ROTATE }}
      onStart={() => {
        goal.current = null; // el usuario manda: se interrumpe el vuelo
      }}
    />
  );
}
