import { create } from 'zustand';

/**
 * Pantalla de carga completa (H33): cargas diferidas en curso (chunks de páginas)
 * y si la pantalla está visible, para que la bienvenida espere a que termine.
 */
interface LoadingScreenStore {
  lazy: number;
  visible: boolean;
  beginLazy: () => void;
  endLazy: () => void;
  setVisible: (visible: boolean) => void;
}

export const useLoadingScreenStore = create<LoadingScreenStore>()((set) => ({
  lazy: 0,
  visible: false,
  beginLazy: () => set((s) => ({ lazy: s.lazy + 1 })),
  endLazy: () => set((s) => ({ lazy: Math.max(0, s.lazy - 1) })),
  setVisible: (visible) => set((s) => (s.visible === visible ? s : { visible })),
}));
