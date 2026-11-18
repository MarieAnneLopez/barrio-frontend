import { create } from 'zustand';
import type { PlaceScope } from './sceneLayers';

// Qué lugares muestra la maqueta (gran actualización). La sección de un módulo fija su `slug` y la
// colección de su lista (con búsqueda y filtros) mientras está abierta; las demás no fijan nada y la
// maqueta muestra los 14 módulos. ScenePlaces lo lee; la ficha también, para hallar el lugar elegido.

interface ScopeState extends PlaceScope {
  setScope: (scope: PlaceScope) => void;
}

export const ALL_PLACES: PlaceScope = { slug: null, collection: null };

export const usePlaceScope = create<ScopeState>()((set) => ({
  ...ALL_PLACES,
  setScope: (scope) => set(scope),
}));
