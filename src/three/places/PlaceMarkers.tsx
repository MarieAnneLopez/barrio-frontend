import { useThree, type ThreeEvent } from '@react-three/fiber';
import { useMemo } from 'react';
import { useSelectionStore, type Selection } from '../selection/selectionStore';
import { screenPick } from './pick';
import type { PlaceLayer } from './placeLayers';
import { useMarkerTexture, usePositionGeometry } from './resources';

/** Lado del marcador en píxeles CSS: no cambia con la distancia, como un alfiler de mapa. */
export const MARKER_PX = 30;

/**
 * Marcadores de un módulo: un sprite por lugar real y una sola llamada de dibujo. Van encima de todo
 * (sin prueba de profundidad), se eligen midiendo en pantalla (pick.ts) y el clic abre la ficha del
 * lugar (selectionStore). Pasar el puntero lo resalta. La cámara no se mueve al hacer clic: vuela solo
 * cuando el lugar se elige en la lista del panel (focusStore).
 */
export function PlaceMarkers({ layer }: { layer: PlaceLayer }) {
  const geometry = usePositionGeometry(layer.markers);
  const texture = useMarkerTexture(layer.emoji, layer.slug);
  const get = useThree((s) => s.get);
  const raycast = useMemo(() => screenPick(get, layer.markers), [get, layer.markers]);

  const placeAt = (event: ThreeEvent<PointerEvent | MouseEvent>): Selection | null => {
    const id = event.index === undefined ? undefined : layer.ids[event.index];
    return id === undefined ? null : { kind: 'place', slug: layer.slug, id };
  };
  const cursor = (value: string) => {
    get().gl.domElement.style.cursor = value;
  };

  return (
    <points
      geometry={geometry}
      raycast={raycast}
      renderOrder={10}
      onClick={(event) => {
        const place = placeAt(event);
        if (!place) return;
        event.stopPropagation();
        useSelectionStore.getState().select(place);
      }}
      onPointerMove={(event) => {
        const place = placeAt(event);
        if (!place) return;
        event.stopPropagation();
        useSelectionStore.getState().hover(place);
        cursor('pointer');
      }}
      onPointerOut={() => {
        useSelectionStore.getState().hover(null);
        cursor('');
      }}
    >
      <pointsMaterial map={texture} size={MARKER_PX} sizeAttenuation={false} transparent alphaTest={0.4}
        depthWrite={false} depthTest={false} />
    </points>
  );
}
