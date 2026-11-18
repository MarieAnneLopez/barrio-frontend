import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { groundPick } from './pick';
import type { PlaceLayer } from './placeLayers';
import type { PlaceShapes } from './placeShapes';
import { usePlacePointer, type PlaceEvent } from './usePlacePointer';

/** ¿El puntero tocó primero esta capa? Lo que esté más cerca de la cámara (un edificio) manda. */
const nearest = (event: PlaceEvent) => event.intersections[0]?.eventObject === event.eventObject;

/**
 * Lotes o tramos de calle que se eligen en el suelo, en la sección de su módulo: sin un marcador por
 * figura (sería una alfombra que tapa el mapa), el clic donde está el lote, o junto al tramo, abre su
 * ficha y pasar el puntero lo resalta (PlaceHighlight) y lo nombra en el pie. No dibuja nada.
 */
export function ShapePicker({ layer, shapes }: { layer: PlaceLayer; shapes: PlaceShapes }) {
  const get = useThree((s) => s.get);
  const raycast = useMemo(() => groundPick(get, shapes, layer.outline), [get, shapes, layer.outline]);
  const handlers = usePlacePointer(layer.slug, (event) =>
    event.index === undefined || !nearest(event) ? undefined : shapes.ids[event.index]);

  return <group raycast={raycast} {...handlers} />;
}
