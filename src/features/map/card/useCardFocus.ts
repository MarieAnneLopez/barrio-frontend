import { useEffect, useRef, type RefObject } from 'react';
import { useSelectionStore, type Selection } from '../../../three/selection/selectionStore';

type Ref = RefObject<HTMLElement | null>;

/** ¿El foco está «en la maqueta» (en la página o en su lienzo), sin un control de por medio? */
const onScene = (el: Element | null) => !el || el === document.body || el.closest('[data-scene-slot]') !== null;
/** Un control que se acaba de ocultar (el panel se cierra al elegir en el celular) ya no tiene el foco. */
const gone = (el: Element | null) => !el?.isConnected || el.closest('[hidden], [inert]') !== null;

/** Cierra la ficha; si el foco estaba en ella, lo devuelve a quien la abrió (o a `fallback`). */
function closeCard(card: Ref, opener: Ref, fallback?: Ref): void {
  const inside = card.current?.contains(document.activeElement) ?? false;
  useSelectionStore.getState().select(null);
  if (!inside) return;
  const back = opener.current && !gone(opener.current) ? opener.current : fallback?.current;
  back?.focus();
}

/**
 * Foco de la ficha (WCAG 2.4.3): si se abrió desde la maqueta, el foco pasa a su título; si se abrió
 * desde un control (la lista del panel), se queda en él. Al cerrarla (botón o Escape) el foco vuelve
 * a donde estaba, o a `fallback`. Escape también la cierra con el foco en la página o en la maqueta.
 */
export function useCardFocus(card: Ref, selected: Selection | null, fallback?: Ref): () => void {
  const opener = useRef<HTMLElement | null>(null);
  const key = selected ? JSON.stringify(selected) : null;

  useEffect(() => {
    if (!key) return;
    const active = document.activeElement;
    const fromScene = onScene(active) || gone(active);
    if (!card.current?.contains(active)) opener.current = fromScene ? null : (active as HTMLElement);
    if (fromScene) card.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }, [key, card]);

  useEffect(() => {
    if (!key) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || !onScene(event.target as Element | null)) return;
      event.preventDefault(); // un solo Escape: cierra la ficha y no también el panel
      closeCard(card, opener, fallback);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [key, card, fallback]);

  return () => closeCard(card, opener, fallback);
}
