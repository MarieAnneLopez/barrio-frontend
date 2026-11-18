import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ModuleFeatures } from '../../lib/apiTypes';
import { onTheModel } from '../../lib/categoryConfig';
import { isSampleRecord } from '../../lib/verification';
import { useFocusStore } from '../../three/camera/focusStore';
import { canvasAspect, placeFocus } from '../../three/camera/placeFocus';
import { useTintal3D } from '../../three/data/useTintal3D';
import { ALL_PLACES, usePlaceScope } from '../../three/places/placeScope';
import { createProjection } from '../../three/projection';
import { sceneHostElement } from '../../three/sceneHost';
import { useSelectionStore } from '../../three/selection/selectionStore';
import { findPlace } from '../map/card/usePlace';

/**
 * La maqueta de la sección de un módulo (gran actualización): mientras está abierta muestra solo
 * los lugares de ese módulo, con la búsqueda y los filtros de su lista (placeScope). Devuelve cómo
 * mostrar un lugar en el mapa: lo elige (ficha a la derecha) y, si es un dato real con ubicación,
 * lleva la cámara hasta él, con su figura entera en la imagen (placeFocus); un dato de ejemplo no se
 * dibuja, así que la cámara no se mueve, y la localidad (la ficha de toda la zona) tampoco: abriría
 * la vista fuera de la isla. `focusId` (?enfoque=ID) hace eso al entrar, cuando ya hay lista y maqueta.
 */
export function useModuleMap(slug: string, collection: ModuleFeatures | null, focusId: number | null) {
  const world = useTintal3D();
  const bbox = world.status === 'ready' ? world.data.manifest.proyeccion.bbox : null;
  const project = useMemo(() => (bbox ? createProjection(bbox) : null), [bbox]);
  const focused = useRef(false);

  useEffect(() => {
    usePlaceScope.getState().setScope({ slug, collection });
  }, [slug, collection]);
  useEffect(() => () => usePlaceScope.getState().setScope(ALL_PLACES), [slug]);

  const showOnMap = useCallback(
    (id: number) => {
      useSelectionStore.getState().select({ kind: 'place', slug, id });
      const item = onTheModel(slug) ? findPlace([collection], id) : null; // la localidad no se señala
      if (!item || isSampleRecord(item) || !project) return;
      const target = placeFocus(item.geometry, project, canvasAspect(sceneHostElement()));
      if (target) useFocusStore.getState().focus(target);
    },
    [slug, collection, project],
  );

  useEffect(() => {
    if (focusId === null || focused.current || !collection || !project) return;
    focused.current = true;
    showOnMap(focusId);
  }, [focusId, collection, project, showOnMap]);

  return showOnMap;
}
