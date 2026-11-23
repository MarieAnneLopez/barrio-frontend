import { useCallback, useEffect, useState } from 'react';

/** Índice seleccionado de la línea de tiempo, siempre dentro de sus límites. */
export function useActiveHito(total: number) {
  const max = Math.max(total - 1, 0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, max));
  }, [max]);

  const prev = useCallback(() => setActiveIndex((index) => Math.max(index - 1, 0)), []);
  const next = useCallback(() => setActiveIndex((index) => Math.min(index + 1, max)), [max]);

  return { activeIndex, prev, next };
}
