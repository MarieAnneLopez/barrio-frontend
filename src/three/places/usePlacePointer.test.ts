import { beforeEach, describe, expect, it } from 'vitest';
import { useSelectionStore } from '../selection/selectionStore';
import { releaseHover } from './usePlacePointer';

// r3f no llama onPointerOut cuando el objeto bajo el puntero se desmonta (al ocultar un módulo en la
// leyenda con el teclado o al salir de la sección): el pie seguía nombrando un lugar que ya no está.
let canvas: HTMLCanvasElement;

beforeEach(() => {
  canvas = document.createElement('canvas');
  canvas.style.cursor = 'pointer';
});

describe('al desaparecer los lugares de un módulo bajo el puntero', () => {
  it('se suelta lo resaltado de ese módulo y el cursor de mano', () => {
    useSelectionStore.setState({ hovered: { kind: 'place', slug: 'barberias', id: 3 } });
    releaseHover('barberias', canvas);
    expect(useSelectionStore.getState().hovered).toBeNull();
    expect(canvas.style.cursor).toBe('');
  });

  it('no toca lo resaltado de otro módulo ni un edificio', () => {
    for (const hovered of [{ kind: 'place', slug: 'librerias', id: 3 }, { kind: 'building', index: 4 }] as const) {
      useSelectionStore.setState({ hovered });
      releaseHover('barberias', canvas);
      expect(useSelectionStore.getState().hovered).toEqual(hovered);
      expect(canvas.style.cursor).toBe('pointer');
    }
  });
});
