import { DENSER, denserThan } from '../lib/density';
import { useMediaQuery } from './useMediaQuery';

/**
 * Múltiplo del recurso que pide esta pantalla (1, 2 o 4) con los umbrales de DENSER, las mismas
 * media queries que usan <picture> e index.html; al día si cambia el zoom o se pasa a otra pantalla.
 * Sin matchMedia, 1.
 */
export function useDensity(): number {
  const [[four, overFour], [two, overTwo]] = DENSER;
  const quad = useMediaQuery(denserThan(overFour), false);
  const double = useMediaQuery(denserThan(overTwo), false);
  return quad ? four : double ? two : 1;
}
