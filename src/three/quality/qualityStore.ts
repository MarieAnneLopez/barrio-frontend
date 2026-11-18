import { create } from 'zustand';
import { deviceHints, initialQuality } from './qualityPolicy';

// Calidad adaptable de la maqueta (gran actualización): la escena mide sus cuadros por segundo y
// baja o sube de nivel. Cada nivel fija la densidad de píxeles, las sombras y cuántos carros,
// personas y árboles se animan; la vida del barrio (src/three/vida) lee `density`.

export type QualityLevel = 0 | 1 | 2;

export interface QualitySettings {
  /** Tope de la densidad de píxeles del lienzo. */
  dpr: number;
  shadows: boolean;
  /** Fracción de carros y personas que se animan (1 = todos). */
  density: number;
}

export const QUALITY: Readonly<Record<QualityLevel, QualitySettings>> = {
  2: { dpr: 2, shadows: true, density: 1 },
  1: { dpr: 1.5, shadows: false, density: 0.6 },
  0: { dpr: 1, shadows: false, density: 0.3 },
};

interface QualityState {
  level: QualityLevel;
  /** Último promedio medido (cuadros por segundo), para el informe de rendimiento. */
  fps: number | null;
  setLevel: (level: QualityLevel) => void;
  setFps: (fps: number) => void;
}

export const useQualityStore = create<QualityState>()((set) => ({
  // Arranca según el equipo (móvil o poca memoria: más abajo); luego la ajusta QualityProbe.
  level: typeof window === 'undefined' ? 2 : initialQuality(deviceHints()),
  fps: null,
  setLevel: (level) => set({ level }),
  setFps: (fps) => set({ fps }),
}));

export const qualitySettings = (level: QualityLevel = useQualityStore.getState().level): QualitySettings => QUALITY[level];
