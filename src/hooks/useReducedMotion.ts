import { useA11yStore } from '../store/a11yStore';
import { useMediaQuery } from './useMediaQuery';

/** Movimiento reducido por la barra de accesibilidad o por el sistema. */
export function useReducedMotion(): boolean {
  const userReduced = useA11yStore((s) => s.reducedMotion);
  const systemReduced = useMediaQuery('(prefers-reduced-motion: reduce)', false);
  return userReduced || systemReduced;
}
