import { useLayoutEffect, type RefObject } from 'react';
import { layoutPeeks } from './welcomeGeometry';

/**
 * Vuelve a anclar las asomadas de la bienvenida si la pantalla cambia mientras está abierta (girar el
 * móvil, cruzar 640 px): en cada `resize` y, tras el nuevo render, cuando cambia su escala (160 ↔ 80 px).
 * Solo mueve los contenedores (left/top y el giro); la animación va en su cuerpo y sigue su curso.
 */
export function useWelcomeRelayout(root: RefObject<HTMLElement>, open: boolean, size: number): void {
  useLayoutEffect(() => {
    const node = root.current;
    if (!open || !node) return undefined;
    layoutPeeks(node);
    const relayout = () => layoutPeeks(node);
    const visual = typeof window.visualViewport === 'object' ? window.visualViewport : null;
    window.addEventListener('resize', relayout);
    visual?.addEventListener('resize', relayout); // la barra del navegador del móvil al aparecer o irse
    return () => {
      window.removeEventListener('resize', relayout);
      visual?.removeEventListener('resize', relayout);
    };
  }, [root, open, size]);
}
