import { useSyncExternalStore } from 'react';

const EVENTS = ['resize', 'orientationchange'] as const;

function subscribe(onChange: () => void): () => void {
  for (const type of EVENTS) window.addEventListener(type, onChange);
  return () => {
    for (const type of EVENTS) window.removeEventListener(type, onChange);
  };
}

/**
 * Ancho de la ventana en px, al día al redimensionarla o girar el celular; escucha solo mientras
 * alguien lo usa. Sin window (SSR), `fallback`.
 */
export function useViewportWidth(fallback = 1280): number {
  return useSyncExternalStore(subscribe, () => window.innerWidth, () => fallback);
}
