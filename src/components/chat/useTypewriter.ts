import { useEffect, useState } from 'react';

/** Caracteres que aparecen en cada paso y duración del paso (typewriter rápido). */
const STEP_CHARS = 2;
const STEP_MS = 16;

/**
 * Revela el texto por partes. Sin animación (movimiento reducido o mensajes
 * anteriores) devuelve el texto completo desde el primer render.
 */
export function useTypewriter(text: string, animate: boolean): string {
  const [count, setCount] = useState(animate ? 0 : text.length);
  const done = !animate || count >= text.length;

  useEffect(() => {
    if (done) return undefined;
    const timer = window.setTimeout(() => setCount((n) => n + STEP_CHARS), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [count, done]);

  return done ? text : text.slice(0, count);
}
