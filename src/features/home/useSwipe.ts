import { useRef, type PointerEvent } from 'react';

const THRESHOLD_PX = 48;
const VELOCITY = 0.11; // px/ms: un deslizamiento rápido basta aunque sea corto

/** Deslizar con el dedo o el puntero: izquierda → siguiente, derecha → anterior. */
export function useSwipe(onNext: () => void, onPrevious: () => void) {
  const start = useRef<{ x: number; t: number } | null>(null);

  return {
    onPointerDown: (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return;
      start.current = { x: event.clientX, t: event.timeStamp };
    },
    onPointerUp: (event: PointerEvent) => {
      const origin = start.current;
      start.current = null;
      if (!origin) return;
      const dx = event.clientX - origin.x;
      const speed = Math.abs(dx) / Math.max(1, event.timeStamp - origin.t);
      if (Math.abs(dx) < THRESHOLD_PX && speed < VELOCITY) return;
      if (dx < 0) onNext();
      else onPrevious();
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
}
