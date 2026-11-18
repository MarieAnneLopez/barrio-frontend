import type { RootState } from '@react-three/fiber';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Esperas antes de volver a montar el lienzo tras perder el contexto (ms). */
export const RECOVERY_MS = [300, 1000, 3000, 8000, 15_000];
/** Tras este tiempo con un contexto sano, la cuenta de intentos vuelve a empezar. */
export const HEALTHY_MS = 20_000;

/**
 * Recuperación automática si el navegador pierde el contexto WebGL (gran actualización): la
 * maqueta no se apaga ni pide un botón; el lienzo se vuelve a montar (key nueva) con esperas
 * crecientes y los datos ya cargados se reutilizan.
 */
export function useContextRecovery(): { key: number; onCreated: (state: Pick<RootState, 'gl'>) => void } {
  const [key, setKey] = useState(0);
  const tries = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const onCreated = useCallback(({ gl }: Pick<RootState, 'gl'>) => {
    const later = (ms: number, run: () => void) => timers.current.push(window.setTimeout(run, ms));
    later(HEALTHY_MS, () => {
      tries.current = 0;
    });
    gl.domElement.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault(); // permite al navegador devolver el contexto
        const wait = RECOVERY_MS[Math.min(tries.current, RECOVERY_MS.length - 1)] ?? 15_000;
        tries.current += 1;
        later(wait, () => setKey((k) => k + 1));
      },
      { once: true },
    );
  }, []);

  return { key, onCreated };
}
