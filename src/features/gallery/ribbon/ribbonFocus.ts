// El foco al cambiar entre la rejilla y la cinta: la foto que lo tenía lo conserva (en su tesela o en su
// botón de la cinta), y lo que no es una foto (el enlace de créditos, un crédito) no se toca.
import { type RefObject, useCallback, useEffect, useRef } from 'react';
import type { RibbonMode } from './useRibbon';

type Attribute = 'data-ribbon-index' | 'data-grid-index';

/** Índice de la foto cuyo botón (el de la cinta o la tesela, según `attribute`) tiene el foco en `root`, o −1. */
export function focusedPhoto(root: HTMLElement | null, attribute: Attribute): number {
  const focused = document.activeElement;
  const button = focused && root?.contains(focused) ? focused.closest(`[${attribute}]`) : null;
  return button ? Number(button.getAttribute(attribute)) : -1;
}

/** Enfoca el botón de la foto `index`, el de la cinta o el de la rejilla (el que esté), sin desplazar la página. */
export function focusPhoto(root: HTMLElement | null, index: number): void {
  root?.querySelector<HTMLElement>(`[data-ribbon-index="${index}"], [data-grid-index="${index}"]`)?.focus({ preventScroll: true });
}

/**
 * `carry(root, attribute)` apunta, justo antes de cambiar de modo, qué foto tenía el foco; al cambiar, se
 * le devuelve en el modo nuevo. Si llega la cinta, además empieza centrada en esa foto (sin recorrido).
 */
export function useFocusCarry(root: RefObject<HTMLElement | null>, mode: RibbonMode, center: (index: number, instant: boolean) => void) {
  const carried = useRef(-1);
  useEffect(() => {
    const index = carried.current;
    if (index < 0 || mode === 'pending') return;
    carried.current = -1;
    if (mode === 'ribbon') center(index, true);
    focusPhoto(root.current, index);
  }, [mode, root, center]);
  return useCallback((scope: HTMLElement | null, attribute: Attribute) => {
    carried.current = focusedPhoto(scope, attribute);
  }, []);
}
