import type { ThreeEvent } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useSelectionStore, type Selection } from '../selection/selectionStore';
import { NO_BUILDING } from './material';
import { buildingOfFace } from './tileGeometry';

// Puntero sobre las mallas de edificios → índice del edificio (atributo aData de la cara) →
// selectionStore: hover al pasar (con cursor de mano) y select al hacer clic. Ningún evento se
// detiene salvo el clic que elige, para no quitarle gestos a la cámara (MapControls) ni a los lugares.

/** Un clic que se movió más que esto (px) fue un arrastre de la cámara: no elige. */
export const CLICK_SLOP_PX = 4;

type Hit = Pick<ThreeEvent<MouseEvent>, 'object' | 'eventObject' | 'face' | 'intersections' | 'nativeEvent'>;

/** Lo más cercano es otra tesela de este mismo grupo: esa llamada ya respondió. */
const BEHIND = 'behind';

/**
 * Edificio bajo el puntero; null si no hay cara o si algo queda delante: otro objeto con eventos (un
 * lugar de los módulos) o un elemento HTML. r3f llama al grupo una vez por cada malla que cruza el
 * rayo, en orden de distancia y siempre con eventObject = el grupo: solo responde la tesela más
 * cercana (BEHIND). drei Html monta los billboards dentro del div donde escucha r3f: sus eventos
 * burbujean hasta r3f, que arma el rayo con offsetX/Y relativos al botón (no apunta bajo el puntero).
 */
const buildingOf = (event: Hit, canvas: HTMLElement): number | null | typeof BEHIND => {
  if (event.nativeEvent.target !== canvas) return null;
  const nearest = event.intersections[0];
  if (nearest && nearest.object !== event.object) return nearest.eventObject === event.eventObject ? BEHIND : null;
  const geometry = (event.object as Partial<Mesh>).geometry;
  return geometry ? buildingOfFace(geometry, event.face) : null;
};

export interface PickHandlers {
  onPointerMove(event: ThreeEvent<PointerEvent>): void;
  onPointerOut(): void;
  onClick(event: ThreeEvent<MouseEvent>): void;
}

/** Cambia el cursor del lienzo (mano sobre un edificio). */
export const cursorOf = (canvas: HTMLElement) => (cursor: string): void => {
  canvas.style.cursor = cursor;
};

/** Handlers del grupo de teselas; `canvas` es el lienzo de r3f (gl.domElement). */
export function createPickHandlers(canvas: HTMLElement): PickHandlers {
  const setCursor = cursorOf(canvas);
  return {
    onPointerMove(event) {
      const index = buildingOf(event, canvas);
      if (index === BEHIND) return;
      const { hovered, hover } = useSelectionStore.getState();
      if (index === null) {
        // Algo quedó delante: suelta el edificio (el cursor es de quien está delante).
        if (hovered?.kind === 'building') hover(null);
        return;
      }
      hover({ kind: 'building', index });
      setCursor('pointer');
    },
    onPointerOut() {
      const { hovered, hover } = useSelectionStore.getState();
      if (hovered?.kind === 'building') hover(null);
      setCursor('');
    },
    onClick(event) {
      if (event.delta > CLICK_SLOP_PX) return;
      const index = buildingOf(event, canvas);
      if (index === null || index === BEHIND) return;
      event.stopPropagation();
      useSelectionStore.getState().select({ kind: 'building', index });
    },
  };
}

interface SelectionUniforms {
  uHover: { value: number };
  uSelected: { value: number };
}

const indexOf = (selection: Selection | null) => (selection?.kind === 'building' ? selection.index : NO_BUILDING);

/** Copia el edificio bajo el puntero y el elegido a los uniformes del material (resalte). */
export function applySelection(uniforms: SelectionUniforms, state: { hovered: Selection | null; selected: Selection | null }): void {
  uniforms.uHover.value = indexOf(state.hovered);
  uniforms.uSelected.value = indexOf(state.selected);
}
