import { useEffect, useSyncExternalStore } from 'react';
import { startTintalData, subscribeTintalData, tintalSnapshot, type TintalState } from './tintalStore';

export type { CategoryData } from './tintalFetch';
export { refreshTintalData, resetTintalData, RETRY_MS, type TintalData } from './tintalStore';

/**
 * Lugares de los módulos (la maqueta en sí no espera a la API). `all`: quien llama muestra los 14
 * (Inicio o Mapa 3D) y necesita también los densos (D121). Nunca se rinde (pedido de Marie: el
 * mensaje de error de la maqueta no debe aparecer): mientras la API no responde sigue en «cargando»
 * y reintenta solo, con esperas crecientes y en silencio.
 */
export function useTintalData(all = false): TintalState {
  useEffect(() => startTintalData(all), [all]);
  return useSyncExternalStore(subscribeTintalData, tintalSnapshot);
}
