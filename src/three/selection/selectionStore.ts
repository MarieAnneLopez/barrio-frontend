import { create } from 'zustand';

// Lo que el visitante eligió en la maqueta (gran actualización). La escena escribe al hacer clic en
// un edificio o en un lugar de un módulo; la ficha de la derecha lo lee. `index` es la posición del
// edificio en los datos 3D (Tintal3D.edificios); un lugar se nombra por su módulo y su id en la API.

export type Selection = { kind: 'building'; index: number } | { kind: 'place'; slug: string; id: number };

interface SelectionState {
  selected: Selection | null;
  /** Bajo el puntero (resalte), sin abrir ficha. */
  hovered: Selection | null;
  select: (selection: Selection | null) => void;
  hover: (selection: Selection | null) => void;
}

const same = (a: Selection | null, b: Selection | null): boolean => JSON.stringify(a) === JSON.stringify(b);

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  selected: null,
  hovered: null,
  select: (selected) => {
    if (!same(get().selected, selected)) set({ selected });
  },
  hover: (hovered) => {
    if (!same(get().hovered, hovered)) set({ hovered });
  },
}));
