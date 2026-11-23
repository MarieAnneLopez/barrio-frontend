/**
 * Cuándo se abre la cubierta de una tarjeta (fracción del alto de la ventana). Solo hay dos estados
 * estables, cubierta (0) y abierta (1); el giro completo lo hace el resorte. Se abre cuando su borde
 * superior sube del 85 % y se vuelve a cerrar (giro inverso) si baja del 95 %: entre ambos conserva el
 * estado anterior, para no parpadear si el visitante se detiene justo en el borde.
 */
export const OPEN_AT = 0.85;
export const CLOSE_AT = 0.95;

export function coverTarget(top: number, viewportHeight: number, previous: number): number {
  if (viewportHeight <= 0 || top < OPEN_AT * viewportHeight) return 1;
  if (top > CLOSE_AT * viewportHeight) return 0;
  return previous >= 0.5 ? 1 : 0;
}

/** Con el foco dentro (teclado), la tarjeta se abre: nunca se navega a ciegas bajo la cubierta. */
export function cardTarget(card: HTMLElement, previous: number): number {
  if (card.contains(document.activeElement)) return 1;
  return coverTarget(card.getBoundingClientRect().top, window.innerHeight, previous);
}

/** La tarjeta se ve en la ventana: sin lienzo montado, lo que el visitante ve es la tarjeta abierta. */
export function isOnScreen(card: HTMLElement): boolean {
  const rect = card.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight;
}
