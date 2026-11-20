import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { MapControls as MapControlsImpl } from 'three-stdlib';
import { useHeroStore } from '../heroStore';
import type { HomeView } from '../referenceView';
import type { SceneMode } from '../sceneHost';
import { useFocusStore } from './focusStore';
import { FOCUS_DISTANCE, focusGoal, keepAbove, type Goal } from './mapView';

const EASE = 3; // ease-out exponencial: ~95 % del recorrido en ~1 s

/**
 * Vuelos de la cámara: al encuadre de la sección (al recentrar y al pasar del Inicio a un mapa o al
 * revés; en el Inicio también al cambiar de aspecto, como antes) y hacia el punto que pida la
 * interfaz (focusStore). «home» se resuelve en cada cuadro: si el lienzo cambia de tamaño en pleno
 * vuelo, llega al encuadre bueno. Movimiento reducido: saltos directos. Nunca por debajo de 50 m.
 * Devuelve con qué cortar el vuelo cuando el usuario toma los controles.
 */
export function useCameraGoal(
  controls: RefObject<MapControlsImpl | null>,
  home: HomeView,
  mode: SceneMode,
  reducedMotion: boolean,
): () => void {
  const camera = useThree((s) => s.camera);
  const goal = useRef<Goal | 'home' | null>(null);
  const placed = useRef(false);
  const wantsFocus = useRef(false);
  const recenterTick = useHeroStore((s) => s.recenterTick);
  const focusTick = useFocusStore((s) => s.tick);
  const reframe = mode === 'cine' ? home : null; // el mapa no salta solo mientras el usuario lo mueve

  useEffect(() => {
    goal.current = 'home';
  }, [recenterTick, mode, reframe]);

  useEffect(() => {
    wantsFocus.current = useFocusStore.getState().target !== null;
  }, [focusTick]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    if (!placed.current) {
      camera.position.copy(home.position);
      c.target.copy(home.target);
      placed.current = true;
      if (goal.current === 'home') goal.current = null;
    }
    const focus = useFocusStore.getState().target;
    if (wantsFocus.current && focus) goal.current = focusGoal(focus, focus.distance ?? FOCUS_DISTANCE, camera.position, c.target);
    wantsFocus.current = false;
    const g = goal.current === 'home' ? home : goal.current;
    if (g) {
      const k = reducedMotion ? 1 : 1 - Math.exp(-EASE * delta);
      c.target.lerp(g.target, k);
      camera.position.lerp(g.position, k);
      if (c.target.distanceTo(g.target) < 0.5 && camera.position.distanceTo(g.position) < 0.5) goal.current = null;
    }
    keepAbove(camera.position);
  });

  return useCallback(() => {
    goal.current = null;
    wantsFocus.current = false;
  }, []);
}
