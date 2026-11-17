// Entrada del usuario convertida en avance del reel: teclas, arrastre y rueda. Funciones puras;
// los oyentes del DOM están en reelPointer.ts y nunca cancelan la rueda ni el toque.

export type KeyAction = 'next' | 'previous' | 'home' | 'open';

/**
 * Qué hace una tecla con el foco en el reel. `index` es el módulo centrado y `travel` dice si el
 * capítulo tiene recorrido de scroll: en ese caso, en el último módulo la flecha abajo (y en el
 * primero, la flecha arriba) se dejan al navegador para que la página siga su camino.
 */
export function keyAction(key: string, index: number, count: number, travel: boolean): KeyAction | null {
  switch (key) {
    case 'ArrowRight':
      return 'next';
    case 'ArrowLeft':
      return 'previous';
    case 'ArrowDown':
      return travel && index === count - 1 ? null : 'next';
    case 'ArrowUp':
      return travel && index === 0 ? null : 'previous';
    case 'Home':
      return 'home';
    case 'Enter':
      return 'open';
    default:
      return null;
  }
}

const clamp = (value: number, limit: number) => Math.min(limit, Math.max(-limit, value));

/** Píxeles de arrastre que valen un módulo: el 26 % del ancho, entre 120 y 420 px. */
export function dragStep(width: number): number {
  return Math.min(420, Math.max(120, width * 0.26));
}

/** Arrastrar hacia la izquierda o hacia abajo avanza; hacia la derecha o hacia arriba retrocede. */
export function dragModules(dx: number, dy: number, width: number): number {
  return (dy - dx) / dragStep(width);
}

/** Tope del impulso que suma un solo evento de rueda, y del impulso acumulado. */
export const WHEEL_LIMIT = 0.4;
export const IMPULSE_LIMIT = 1;
/** Píxeles de rueda que darían un impulso de 1 si no hubiera tope por evento. */
const WHEEL_SPAN = 320;
/** deltaMode: 0 = píxeles, 1 = líneas, 2 = páginas. */
const WHEEL_UNIT = [1, 16, 800];

/** Impulso de un evento de rueda, limitado (una rueda libre o un panel táctil no disparan el reel). */
export function wheelImpulse(deltaY: number, deltaMode: number): number {
  return clamp((deltaY * (WHEEL_UNIT[deltaMode] ?? 1)) / WHEEL_SPAN, WHEEL_LIMIT);
}

/** Suma un impulso al acumulado sin pasar del tope. */
export function addImpulse(current: number, impulse: number): number {
  return clamp(current + impulse, IMPULSE_LIMIT);
}
