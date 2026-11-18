import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { screenPick } from './pick';
import type { PlaceLayer } from './placeLayers';
import { useMarkerTexture, usePositionGeometry } from './resources';
import { usePlacePointer } from './usePlacePointer';

/** Lado del marcador en píxeles CSS: no cambia con la distancia, como un alfiler de mapa. */
export const MARKER_PX = 30;

/**
 * Marcadores de un módulo: un sprite por lugar real y una sola llamada de dibujo. Van encima de todo
 * (sin prueba de profundidad), se eligen midiendo en pantalla (pick.ts) y el clic abre la ficha del
 * lugar (usePlacePointer). Pasar el puntero lo resalta.
 */
export function PlaceMarkers({ layer }: { layer: PlaceLayer }) {
  const geometry = usePositionGeometry(layer.markers);
  const texture = useMarkerTexture(layer.emoji, layer.slug);
  const get = useThree((s) => s.get);
  const raycast = useMemo(() => screenPick(get, layer.markers), [get, layer.markers]);
  const handlers = usePlacePointer(layer.slug, (event) => (event.index === undefined ? undefined : layer.ids[event.index]));

  return (
    <points geometry={geometry} raycast={raycast} renderOrder={10} {...handlers}>
      <pointsMaterial map={texture} size={MARKER_PX} sizeAttenuation={false} transparent alphaTest={0.4}
        depthWrite={false} depthTest={false} />
    </points>
  );
}
