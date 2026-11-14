import { useEffect, useRef, useState } from 'react';
import { loadingSnapshot, useLoadingStore } from '../store/loadingStore';

/** Tiempo mínimo visible: evita que la barra parpadee en cargas rápidas (§11.3.5). */
export const MIN_VISIBLE_MS = 650;
/** Tras llegar al 100 %, la barra se desvanece en este tiempo. */
export const FINISH_MS = 240;

type Phase = 'hidden' | 'loading' | 'finishing';

/**
 * Progreso real del lote de cargas (store/loadingStore) con duración mínima:
 * aparece al empezar una carga, sigue al menos 650 ms y al terminar marca
 * 100 % antes de ocultarse. Una carga nueva durante el cierre la retoma.
 */
export function useLoadingProgress(): { visible: boolean; finishing: boolean; progress: number } {
  const { active, progress } = loadingSnapshot(useLoadingStore((s) => s.tasks));
  const [phase, setPhase] = useState<Phase>('hidden');
  const startedAt = useRef(0);

  // Ajuste durante el render (sin efecto en cascada): una carga activa muestra la barra.
  if (active && phase !== 'loading') setPhase('loading');

  useEffect(() => {
    if (phase === 'loading') startedAt.current = performance.now();
  }, [phase]);

  useEffect(() => {
    if (active || phase !== 'loading') return undefined;
    const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - startedAt.current));
    const timer = window.setTimeout(() => setPhase('finishing'), wait);
    return () => window.clearTimeout(timer);
  }, [active, phase]);

  useEffect(() => {
    if (phase !== 'finishing') return undefined;
    const timer = window.setTimeout(() => setPhase('hidden'), FINISH_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return { visible: phase !== 'hidden', finishing: phase === 'finishing', progress: active ? progress : 1 };
}
