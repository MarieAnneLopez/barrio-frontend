import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFocusStore } from '../../../three/camera/focusStore';
import { useTintal3D } from '../../../three/data/useTintal3D';
import { buildingInfo } from '../../../three/selection/buildingInfo';
import { useSelectionStore } from '../../../three/selection/selectionStore';

/** Distancia del vuelo a un edificio pedido por enlace (m): se ve con su manzana. */
const BUILDING_DISTANCE = 900;

/**
 * Enlaces directos al escenario: `?panel=abierto` lo abre con el panel desplegado y `?edificio=N`
 * con la ficha de ese edificio (índice en los datos 3D) y la cámara sobre él. Se leen al entrar.
 * Devuelve si el panel empieza abierto.
 */
export function useStageParams(): boolean {
  const [params] = useSearchParams();
  const [panelOpen] = useState(() => params.get('panel') === 'abierto');
  const [building] = useState(() => {
    const raw = params.get('edificio');
    return raw !== null && /^\d+$/.test(raw) ? Number(raw) : null;
  });
  const world = useTintal3D();
  const edificios = world.status === 'ready' ? world.data.edificios : null;

  useEffect(() => {
    if (building === null || !edificios) return;
    const info = buildingInfo(edificios, building);
    if (!info) return;
    useSelectionStore.getState().select({ kind: 'building', index: building });
    useFocusStore.getState().focus({ x: info.center[0], z: info.center[1], distance: BUILDING_DISTANCE });
  }, [building, edificios]);

  return panelOpen;
}
