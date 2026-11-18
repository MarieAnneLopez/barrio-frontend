import { create } from 'zustand';
import { useSelectionStore } from './selection/selectionStore';

/** Edificio bajo el puntero de la capa anterior (BuildingsLayer); la interfaz ya lee selectionStore. */
export interface HoveredBuilding {
  index: number;
  kind: string | null;
  levels: number;
  areaM2: number;
}

interface HeroState {
  /** Órbita automática en pausa (botón del HUD, WCAG 2.2.2). */
  paused: boolean;
  /** El usuario interactúa (puntero dentro o arrastre): la órbita se detiene. */
  interacting: boolean;
  hovered: HoveredBuilding | null;
  /** Categorías ocultas con el filtro de la leyenda (H34). */
  hidden: string[];
  /** Lugares que la escena dibujó por categoría (se compara con la base de datos). */
  drawn: Record<string, number>;
  /** Cambia cada vez que se pulsa «Recentrar»: la cámara vuelve al encuadre inicial. */
  recenterTick: number;
  togglePaused: () => void;
  /** Vuelve al encuadre inicial y cierra la ficha de lo elegido (selectionStore). */
  recenter: () => void;
  toggleCategory: (slug: string) => void;
  setDrawn: (drawn: Record<string, number>) => void;
  setInteracting: (value: boolean) => void;
  setHovered: (value: HoveredBuilding | null) => void;
}

export const useHeroStore = create<HeroState>()((set) => ({
  paused: false,
  interacting: false,
  hovered: null,
  hidden: [],
  drawn: {},
  recenterTick: 0,
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  recenter: () => {
    useSelectionStore.getState().select(null);
    set((s) => ({ recenterTick: s.recenterTick + 1 }));
  },
  toggleCategory: (slug) =>
    set((s) => ({ hidden: s.hidden.includes(slug) ? s.hidden.filter((x) => x !== slug) : [...s.hidden, slug] })),
  setDrawn: (drawn) => set({ drawn }),
  setInteracting: (interacting) => set({ interacting }),
  setHovered: (hovered) => set({ hovered }),
}));
