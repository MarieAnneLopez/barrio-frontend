import { create } from 'zustand';

/** Lugar destacado en la maqueta (billboard) que puede abrir su ficha. */
export interface HeroPlace {
  id: number;
  name: string;
  slug: string;
  emoji: string;
  position: [number, number, number];
}

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
  selected: HeroPlace | null;
  /** Categorías ocultas con el filtro de la leyenda (H34). */
  hidden: string[];
  /** Lugares que la escena dibujó por categoría (se compara con la base de datos). */
  drawn: Record<string, number>;
  /** Cambia cada vez que se pulsa «Recentrar»: la cámara vuelve al encuadre inicial. */
  recenterTick: number;
  togglePaused: () => void;
  recenter: () => void;
  toggleCategory: (slug: string) => void;
  setDrawn: (drawn: Record<string, number>) => void;
  setInteracting: (value: boolean) => void;
  setHovered: (value: HoveredBuilding | null) => void;
  select: (place: HeroPlace | null) => void;
}

export const useHeroStore = create<HeroState>()((set) => ({
  paused: false,
  interacting: false,
  hovered: null,
  selected: null,
  hidden: [],
  drawn: {},
  recenterTick: 0,
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  recenter: () => set((s) => ({ selected: null, recenterTick: s.recenterTick + 1 })),
  toggleCategory: (slug) =>
    set((s) => ({ hidden: s.hidden.includes(slug) ? s.hidden.filter((x) => x !== slug) : [...s.hidden, slug] })),
  setDrawn: (drawn) => set({ drawn }),
  setInteracting: (interacting) => set({ interacting }),
  setHovered: (hovered) => set({ hovered }),
  select: (selected) => set({ selected }),
}));
