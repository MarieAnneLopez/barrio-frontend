import { useLayoutEffect, useRef, type RefObject } from 'react';
import { useSceneHost, type SceneMode } from '../../../three/sceneHost';

/** Solo el recuadro dueño del lienzo puede detenerlo o desconectarlo al salir. */
export function useStageSlot(section: RefObject<HTMLElement | null>, mode: SceneMode = 'mapa'): RefObject<HTMLDivElement> {
  const slot = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const owner = slot.current;
    const region = section.current;
    if (!owner || !region) return;
    const { attach, detach, setVisible } = useSceneHost.getState();
    attach(owner, mode);
    let mounted = true;
    const observer = typeof IntersectionObserver !== 'undefined' && new IntersectionObserver((entries) => {
      const latest = entries[entries.length - 1];
      if (mounted && latest) setVisible(owner, latest.isIntersecting);
    });
    if (observer) observer.observe(region);
    return () => {
      mounted = false;
      if (observer) observer.disconnect();
      detach(owner);
    };
  }, [mode, section]);
  return slot;
}
