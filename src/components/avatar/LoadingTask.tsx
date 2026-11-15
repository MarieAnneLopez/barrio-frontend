import { useEffect } from 'react';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
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
    // También muestra la pantalla de carga completa (H33) mientras baja el chunk.
    const screen = useLoadingScreenStore.getState();
    screen.beginLazy();
    return () => {
      end(id);
      screen.endLazy();
    };
  }, []);
  return null;
}
