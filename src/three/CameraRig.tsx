import { MapControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { MathUtils, TOUCH, type Fog, type PerspectiveCamera } from 'three';
import type { MapControls as MapControlsImpl } from 'three-stdlib';
import { mapView } from './camera/mapView';
import { MAP_REACH, MAX_POLAR_DEG, rigLimits } from './camera/rigMode';
import { useCameraGoal } from './camera/useCameraGoal';
import { useControlsGuard } from './camera/useControlsGuard';
import { useHeroStore } from './heroStore';
import { homeView } from './referenceView';
import { useSceneHost } from './sceneHost';
import { useSelectionStore } from './selection/selectionStore';

const AUTO_ROTATE_SPEED = 0.33; // unidades de three: ~una vuelta cada 3 minutos

interface Props {
  radius: number;
  /** Malla vial, zona con más edificios, manzana mediana y caja del barrio (de los datos): los encuadres. */
  view: {
    grid: number;
    spot: readonly [number, number];
    blockSize: number;
    center: readonly [number, number];
    size: readonly [number, number];
  };
  reducedMotion: boolean;
}

/**
 * Cámara de la maqueta (H34, D83; gran actualización). En el Inicio («cine»): el encuadre con la
 * inclinación, el giro y las calles por ancho medidos en la referencia, órbita pausable y, en
 * táctil, un dedo que deja pasar el scroll. En las secciones con mapa («mapa», sceneHost): norte
 * arriba con el barrio entero, sin órbita, un dedo mueve y dos acercan o giran. Arrastrar mueve
 * (botón derecho gira) y la rueda acerca. Vuelos al encuadre y al lugar pedido (focusStore); la
 * cámara nunca baja de 50 m. Movimiento reducido: sin órbita y saltos directos.
 */
export function CameraRig({ radius, view, reducedMotion }: Props) {
  const controls = useRef<MapControlsImpl>(null);
  const canvas = useThree((s) => s.gl.domElement);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const mode = useSceneHost((s) => s.mode);
  const home = useMemo(
    () => (mode === 'mapa' ? mapView(view, aspect, radius * MAP_REACH) : homeView(view.grid, view.spot, view.blockSize, aspect)),
    [mode, view, aspect, radius],
  );
  const limits = rigLimits(mode, home.distance, radius);
  const cancel = useCameraGoal(controls, home, mode, reducedMotion);
  const epoch = useControlsGuard(controls);
  const paused = useHeroStore((s) => s.paused);
  const interacting = useHeroStore((s) => s.interacting);
  const selected = useSelectionStore((s) => s.selected);

  useFrame((state) => {
    // MapControls pone touch-action: none en el elemento de eventos de r3f y en el canvas. En el
    // Inicio, pan-y devuelve el scroll a la página (un dedo baja, dos manejan la maqueta).
    const surfaces = [state.gl.domElement, state.events.connected as HTMLElement | undefined];
    for (const el of surfaces) if (el && el.style.touchAction !== limits.touchAction) el.style.touchAction = limits.touchAction;
    const c = controls.current;
    if (!c) return;
    c.enabled = true; // nada debe dejar la cámara apagada
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
  });

  return (
    <MapControls
      domElement={canvas}
      key={epoch}
      ref={controls}
      makeDefault
      enableDamping={!reducedMotion}
      autoRotate={limits.orbit && !reducedMotion && !paused && !interacting && !selected}
      autoRotateSpeed={AUTO_ROTATE_SPEED}
      minDistance={limits.minDistance}
      maxDistance={limits.maxDistance}
      maxPolarAngle={MathUtils.degToRad(MAX_POLAR_DEG)}
      touches={{ ONE: limits.oneFinger, TWO: TOUCH.DOLLY_ROTATE }}
      onStart={cancel} // el usuario manda: se interrumpe el vuelo
    />
  );
}
