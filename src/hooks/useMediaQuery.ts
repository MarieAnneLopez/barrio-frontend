import { useSyncExternalStore } from 'react';

/** true si la media query coincide; sin matchMedia (pruebas, SSR) asume `fallback`. */
export function useMediaQuery(query: string, fallback = true): boolean {
  const supported = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  return useSyncExternalStore(
    (onChange) => {
      if (!supported) return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => (supported ? window.matchMedia(query).matches : fallback),
    () => fallback,
  );
}
