import { useEffect, useRef, useState } from 'react';
import { useLoadingScreenStore } from '../store/loadingScreenStore';
import { loadingSnapshot, useLoadingStore } from '../store/loadingStore';

/** Tiempo mínimo en pantalla (H33): la zancada completa se ve al menos una vez. */
export const SCREEN_MIN_MS = 700;
/** Salida con fundido, más corta que la entrada. */
export const SCREEN_LEAVE_MS = 240;
/** Arranque: termina tras este silencio de la red… */
const BOOT_QUIET_MS = 150;
/** …o a este tope, para no esconder la página si el servidor tarda en despertar. */
export const BOOT_MAX_MS = 8000;

/** Cuánto falta para poder ocultarla, dado cuándo apareció. */
export function remainingVisible(shownAt: number, now: number, min = SCREEN_MIN_MS): number {
  return Math.max(0, min - (now - shownAt));
}

type Phase = 'shown' | 'leaving' | 'hidden';

/**
 * Visible en toda carga (pedido de Marie): el arranque, el código de una página y cada
 * petición de datos (el chat no cuenta: tiene su «pensando…»); nunca menos de 700 ms;
 * al terminar se desvanece.
 */
export function useLoadingScreen(): { visible: boolean; leaving: boolean; busy: boolean } {
  const apiActive = loadingSnapshot(useLoadingStore((s) => s.tasks)).active;
  const lazy = useLoadingScreenStore((s) => s.lazy) > 0;
  const [booting, setBooting] = useState(true);
  const [phase, setPhase] = useState<Phase>('shown');
  const shownAt = useRef(0);
  const wanted = booting || lazy || apiActive;

  if (wanted && phase !== 'shown') setPhase('shown');

  useEffect(() => {
    if (phase === 'shown') shownAt.current = performance.now();
  }, [phase]);

  useEffect(() => {
    if (!booting) return undefined;
    const cap = window.setTimeout(() => setBooting(false), BOOT_MAX_MS);
    const quiet = apiActive ? undefined : window.setTimeout(() => setBooting(false), BOOT_QUIET_MS);
    return () => {
      window.clearTimeout(cap);
      window.clearTimeout(quiet);
    };
  }, [booting, apiActive]);

  useEffect(() => {
    if (wanted || phase !== 'shown') return undefined;
    const timer = window.setTimeout(() => setPhase('leaving'), remainingVisible(shownAt.current, performance.now()));
    return () => window.clearTimeout(timer);
  }, [wanted, phase]);

  useEffect(() => {
    if (phase !== 'leaving') return undefined;
    const timer = window.setTimeout(() => setPhase('hidden'), SCREEN_LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // `busy`: aún hay algo que esperar (la barra de progreso se llena cuando deja de haberlo).
  return { visible: phase !== 'hidden', leaving: phase === 'leaving', busy: wanted };
}
