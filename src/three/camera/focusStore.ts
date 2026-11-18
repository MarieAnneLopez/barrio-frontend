import { create } from 'zustand';

// Pedidos de encuadre a la cámara de la maqueta (gran actualización): la interfaz del mapa pide
// «lleva la cámara a este punto» (al abrir la ficha de un lugar o la vista previa) y CameraRig vuela
// hasta allí. Coordenadas en metros de la proyección local (x al este, z al sur).

export interface FocusTarget {
  x: number;
  z: number;
  /** Distancia de la cámara al punto, en metros; si falta, CameraRig elige una cercana. */
  distance?: number;
}

interface FocusState {
  target: FocusTarget | null;
  /** Cambia en cada pedido, también si se repite el mismo punto. */
  tick: number;
  focus: (target: FocusTarget | null) => void;
}

export const useFocusStore = create<FocusState>()((set) => ({
  target: null,
  tick: 0,
  focus: (target) => set((state) => ({ target, tick: state.tick + 1 })),
}));
