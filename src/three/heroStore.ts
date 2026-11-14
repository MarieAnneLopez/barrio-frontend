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
  togglePaused: () => void;
  setInteracting: (value: boolean) => void;
  setHovered: (value: HoveredBuilding | null) => void;
  select: (place: HeroPlace | null) => void;
}

export const useHeroStore = create<HeroState>()((set) => ({
  paused: false,
  interacting: false,
  hovered: null,
  selected: null,
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setInteracting: (interacting) => set({ interacting }),
  setHovered: (hovered) => set({ hovered }),
  select: (selected) => set({ selected }),
}));
