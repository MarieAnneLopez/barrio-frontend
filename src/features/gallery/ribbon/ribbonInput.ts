// Lo demás que la cinta escucha sobre su contenedor: la rueda (en pasivo: nunca se cancela, la página
// sigue desplazándose), la activación de los botones y adónde va el foco. Las teclas llegan desde React.
import { wheelPixels } from './ribbonMotion';

export type KeyAction = 'next' | 'previous' | 'home';

/** Flechas: anterior y siguiente; Home: la primera. Lo demás (también Escape) es del navegador. */
export function keyAction(key: string): KeyAction | null {
  if (key === 'ArrowRight') return 'next';
  if (key === 'ArrowLeft') return 'previous';
  return key === 'Home' ? 'home' : null;
}

export interface InputHandlers {
  onWheel(pixels: number): void;
  /** Se activó el botón de una foto: con el teclado o un lector de pantalla (detail 0), o con el puntero. */
  onActivate(index: number, keyboard: boolean): void;
  /** El foco pasó al botón de una foto (−1 si salió de la cinta); `visible` = :focus-visible. */
  onFocus(index: number, visible: boolean): void;
}

/** Índice de la foto del botón que contiene a `target`, o −1. */
export function photoIndexOf(target: EventTarget | null): number {
  const button = target instanceof Element ? target.closest<HTMLElement>('[data-ribbon-index]') : null;
  return button ? Number(button.dataset.ribbonIndex) : -1;
}

function focusVisible(element: Element): boolean {
  try {
    return element.matches(':focus-visible');
  } catch {
    return true; // sin soporte del selector: mejor un anillo de más que ninguno
  }
}

export function bindInput(frame: HTMLElement, handlers: InputHandlers): () => void {
  const wheel = (event: WheelEvent) => handlers.onWheel(wheelPixels(event.deltaX, event.deltaY, event.deltaMode));
  const click = (event: MouseEvent) => {
    const index = photoIndexOf(event.target);
    if (index >= 0) handlers.onActivate(index, event.detail === 0);
  };
  const focusIn = (event: FocusEvent) => {
    const index = photoIndexOf(event.target);
    handlers.onFocus(index, index >= 0 && focusVisible(event.target as Element));
  };
  const focusOut = (event: FocusEvent) => {
    if (!(event.relatedTarget instanceof Node && frame.contains(event.relatedTarget))) handlers.onFocus(-1, false);
  };
  frame.addEventListener('wheel', wheel, { passive: true });
  frame.addEventListener('click', click);
  frame.addEventListener('focusin', focusIn);
  frame.addEventListener('focusout', focusOut);
  return () => {
    frame.removeEventListener('wheel', wheel);
    frame.removeEventListener('click', click);
    frame.removeEventListener('focusin', focusIn);
    frame.removeEventListener('focusout', focusOut);
  };
}
