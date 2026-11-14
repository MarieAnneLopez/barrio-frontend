import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Niveles de tamaño de letra (§11.2.3): 90 %, 100 %, 112,5 % y 125 %. */
export const FONT_SCALES = [0.9, 1, 1.125, 1.25] as const;
const DEFAULT_SCALE_INDEX = 1;

interface A11yState {
  highContrast: boolean;
  scaleIndex: number;
  reducedMotion: boolean;
  toggleHighContrast: () => void;
  increaseFont: () => void;
  decreaseFont: () => void;
  toggleReducedMotion: () => void;
  reset: () => void;
}

function systemPrefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

const clampIndex = (index: number) => Math.min(FONT_SCALES.length - 1, Math.max(0, index));

export const useA11yStore = create<A11yState>()(
  persist(
    (set) => ({
      highContrast: false,
      scaleIndex: DEFAULT_SCALE_INDEX,
      reducedMotion: systemPrefersReducedMotion(),
      toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
      increaseFont: () => set((s) => ({ scaleIndex: clampIndex(s.scaleIndex + 1) })),
      decreaseFont: () => set((s) => ({ scaleIndex: clampIndex(s.scaleIndex - 1) })),
      toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),
      reset: () =>
        set({
          highContrast: false,
          scaleIndex: DEFAULT_SCALE_INDEX,
          reducedMotion: systemPrefersReducedMotion(),
        }),
    }),
    {
      name: 'mini-marie:a11y',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ highContrast, scaleIndex, reducedMotion }) => ({
        highContrast,
        scaleIndex,
        reducedMotion,
      }),
    },
  ),
);

/** Escala actual (multiplicador de --font-scale). */
export const fontScaleOf = (index: number) => FONT_SCALES[clampIndex(index)] ?? 1;
