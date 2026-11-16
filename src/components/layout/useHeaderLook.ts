import { useEffect, useSyncExternalStore, type RefObject } from 'react';
import { currentLook, DEFAULT_LOOK, registerTone, subscribeLook, type HeaderLook } from './toneRegistry';

/** Aspecto del header (tono y transparencia) según la sección que pasa bajo él. */
export function useHeaderLook(): HeaderLook {
  return useSyncExternalStore(subscribeLook, currentLook, () => DEFAULT_LOOK);
}

/**
 * Declara que la sección de `ref` decide el aspecto del header mientras pasa bajo él. La sección
 * lleva `data-tone="noche|papel"` y, si el header debe ser transparente, `data-header-float`.
 */
export function useToneSection(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => (ref.current ? registerTone(ref.current) : undefined), [ref]);
}
