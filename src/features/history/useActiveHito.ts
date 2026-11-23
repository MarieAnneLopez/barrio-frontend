import { useCallback, useState } from 'react';

/** Índice seleccionado de la línea de tiempo, siempre dentro de sus límites. */
export function useActiveHito(total: number) {
  const max = Math.max(total - 1, 0);
  const [rawIndex, setRawIndex] = useState(0);
  // Derivado (sin efecto): si cambia el número de hitos, el índice se acota en el mismo render.
  const activeIndex = Math.min(rawIndex, max);

  const prev = useCallback(() => setRawIndex((index) => Math.max(Math.min(index, max) - 1, 0)), [max]);
  const next = useCallback(() => setRawIndex((index) => Math.min(index + 1, max)), [max]);

  return { activeIndex, prev, next };
}
