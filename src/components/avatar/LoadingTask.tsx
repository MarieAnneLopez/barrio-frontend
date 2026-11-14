import { useEffect } from 'react';
import { useLoadingStore } from '../../store/loadingStore';

/**
 * Registra una carga diferida (chunk del mapa o de la escena 3D) mientras está
 * montado: va como fallback de Suspense. Etapa real: pedido el chunk (30 %);
 * se completa al desmontarse, cuando el chunk llegó y el componente se pinta.
 */
export function LoadingTask() {
  useEffect(() => {
    const { begin, update, end } = useLoadingStore.getState();
    const id = begin();
    update(id, 0.3);
    return () => end(id);
  }, []);
  return null;
}
