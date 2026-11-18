import { useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect } from 'react';
import { useSelectionStore, type Selection } from '../selection/selectionStore';

export type PlaceEvent = ThreeEvent<PointerEvent | MouseEvent>;

/**
 * Suelta lo resaltado de un módulo y el cursor de mano. r3f no llama onPointerOut si el objeto bajo
 * el puntero se desmonta (al ocultar el módulo en la leyenda o al salir de la sección); lo de otro
 * módulo o un edificio no se toca.
 */
export function releaseHover(slug: string, canvas: HTMLElement): void {
  const { hovered, hover } = useSelectionStore.getState();
  if (hovered?.kind !== 'place' || hovered.slug !== slug) return;
  hover(null);
  canvas.style.cursor = '';
}

/**
 * Puntero sobre los lugares de un módulo (sus marcadores o sus figuras en el suelo): el clic abre la
 * ficha del lugar (selectionStore) y pasar el puntero lo resalta y lo nombra en el pie, con cursor de
 * mano. La cámara no se mueve al hacer clic: vuela solo cuando el lugar se elige en la lista del panel.
 * `idAt` dice qué lugar tocó el puntero (undefined: ninguno de este módulo).
 */
export function usePlacePointer(slug: string, idAt: (event: PlaceEvent) => number | undefined) {
  const get = useThree((s) => s.get);
  useEffect(() => () => releaseHover(slug, get().gl.domElement), [slug, get]);
  const cursor = (value: string) => {
    get().gl.domElement.style.cursor = value;
  };
  const placeAt = (event: PlaceEvent): Selection | null => {
    const id = idAt(event);
    return id === undefined ? null : { kind: 'place', slug, id };
  };

  return {
    onClick: (event: PlaceEvent) => {
      const place = placeAt(event);
      if (!place) return;
      event.stopPropagation();
      useSelectionStore.getState().select(place);
    },
    onPointerMove: (event: PlaceEvent) => {
      const place = placeAt(event);
      if (!place) return;
      event.stopPropagation();
      useSelectionStore.getState().hover(place);
      cursor('pointer');
    },
    onPointerOut: () => releaseHover(slug, get().gl.domElement),
  };
}
