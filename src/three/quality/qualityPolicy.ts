import type { QualityLevel } from './qualityStore';

// Política de la calidad adaptable (gran actualización): baja rápido si el equipo no da y sube
// despacio si le sobra, para que no oscile. Metas del encargo: ≥ 50 fps en escritorio y ≥ 30 en
// un móvil emulado.

export const LOW_FPS = 42;
export const HIGH_FPS = 57;
/** Tiempo seguido por debajo o por encima antes de cambiar de nivel. */
export const DOWN_AFTER_MS = 2500;
export const UP_AFTER_MS = 12_000;

export interface QualityTrack {
  level: QualityLevel;
  lowMs: number;
  highMs: number;
}

/** Siguiente estado tras `dtMs` milisegundos midiendo `fps` cuadros por segundo de media. */
export function nextQuality(track: QualityTrack, fps: number, dtMs: number, max: QualityLevel = 2): QualityTrack {
  const lowMs = fps < LOW_FPS ? track.lowMs + dtMs : 0;
  const highMs = fps > HIGH_FPS ? track.highMs + dtMs : 0;
  if (lowMs >= DOWN_AFTER_MS && track.level > 0) return { level: (track.level - 1) as QualityLevel, lowMs: 0, highMs: 0 };
  if (highMs >= UP_AFTER_MS && track.level < max) return { level: (track.level + 1) as QualityLevel, lowMs: 0, highMs: 0 };
  return { level: track.level, lowMs, highMs };
}

interface DeviceHints {
  coarsePointer: boolean;
  width: number;
  memoryGb?: number | undefined;
  cores?: number | undefined;
}

/** Nivel de arranque: los móviles y los equipos con poca memoria empiezan más abajo. */
export function initialQuality({ coarsePointer, width, memoryGb, cores }: DeviceHints): QualityLevel {
  if ((memoryGb !== undefined && memoryGb <= 2) || (cores !== undefined && cores <= 2)) return 0;
  if (coarsePointer || width < 768 || (memoryGb !== undefined && memoryGb <= 4)) return 1;
  return 2;
}

/** Pistas del navegador actual (deviceMemory no existe en todos). */
export function deviceHints(): DeviceHints {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
    width: window.innerWidth,
    memoryGb: nav.deviceMemory,
    cores: nav.hardwareConcurrency || undefined,
  };
}
