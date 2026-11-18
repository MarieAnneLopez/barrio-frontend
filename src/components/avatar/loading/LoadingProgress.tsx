import { useState, type ReactNode } from 'react';
import { loadingSnapshot, useLoadingStore } from '../../../store/loadingStore';
import { LoadingBar } from './LoadingBar';
import { nextTarget, START } from './progressSpring';

interface LoadingProgressProps {
  /** Hay algo que justifica la pantalla (arranque, chunks o datos): useLoadingScreen. */
  busy: boolean;
  reduced: boolean;
  rider?: (shown: number) => ReactNode;
}

/**
 * Progreso real de la pantalla de carga: el avance medio de las tareas en curso (peticiones de
 * datos y chunks, loadingStore), que nunca retrocede mientras la pantalla sigue a la vista; cuando
 * ya no queda nada, se llena. Cada aparición de la pantalla monta uno nuevo, desde la astilla.
 */
export function LoadingProgress({ busy, reduced, rider }: LoadingProgressProps) {
  const { active, progress } = loadingSnapshot(useLoadingStore((s) => s.tasks));
  const [target, setTarget] = useState(START);
  const next = nextTarget(target, { busy, active, progress });
  // Ajuste durante el render: el objetivo solo sube.
  if (next > target) setTarget(next);
  return <LoadingBar target={Math.max(target, next)} reduced={reduced} {...(rider ? { rider } : {})} />;
}
