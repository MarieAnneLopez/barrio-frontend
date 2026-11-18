import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { useSceneHost } from '../../../three/sceneHost';

/**
 * Presta el recuadro del escenario a la maqueta única (ScenePortal, D83) en modo «mapa»: no crea
 * otro lienzo ni otro contexto WebGL. Fuera de pantalla (al bajar al pie) deja de dibujar cuadros.
 */
export function useStageSlot(section: RefObject<HTMLElement | null>): RefObject<HTMLDivElement> {
  const slot = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const { attach, detach } = useSceneHost.getState();
    if (slot.current) attach(slot.current, 'mapa');
    return detach;
  }, []);

  useEffect(() => {
    const node = section.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => useSceneHost.getState().setVisible(entry?.isIntersecting ?? true));
    observer.observe(node);
    return () => observer.disconnect();
  }, [section]);

  return slot;
}
