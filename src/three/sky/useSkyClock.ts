import { useEffect, useState } from 'react';
import { skyAt, STILL_MS, type SkyState } from './cycle';

/**
 * El ciclo para la interfaz que rodea la maqueta (D106): botón del menú, paneles de vidrio y
 * leyenda cambian de tono de noche. Se recalcula cada pocos segundos, no en cada cuadro; con
 * movimiento reducido queda en el día quieto de la maqueta.
 */
export function useSkyClock(still: boolean, everyMs = 5000): SkyState {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (still) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), everyMs);
    return () => window.clearInterval(timer);
  }, [still, everyMs]);
  return skyAt(still ? STILL_MS : now);
}
