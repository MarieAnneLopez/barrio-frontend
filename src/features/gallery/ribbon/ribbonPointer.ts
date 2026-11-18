// Arrastre sobre la cinta. El puntero se captura solo pasados 6 px (antes es un clic normal sobre su
// botón); al soltar se informa del último movimiento para el lanzamiento, y el clic sintético que
// cierra un arrastre se descarta antes de que llegue a ningún botón. El CSS (touch-action: pan-y) deja
// al navegador los gestos verticales del dedo, que llegan aquí como «pointercancel».

export interface DragHandlers {
  /** Se pulsó: todavía no se sabe si es un clic o un arrastre. */
  onPress(): void;
  /** Arrastre: px en horizontal desde donde se pulsó. */
  onDrag(dx: number): void;
  /** Fin del gesto: si hubo arrastre, el último movimiento (px), hace cuánto (ms) y si el navegador se lo quedó. */
  onRelease(dragged: boolean, lastDx: number, sinceMs: number, cancelled: boolean): void;
}

/** Por debajo de esto, mover el puntero es un temblor del clic (px). */
export const SLOP = 6;
/** El clic que llega después de soltar un arrastre se descarta durante este tiempo (ms). */
const SWALLOW_MS = 400;

interface Press {
  id: number;
  x: number;
  y: number;
  dragging: boolean;
  lastX: number;
  lastDx: number;
  lastAt: number;
}

/** Conecta los oyentes y devuelve cómo retirarlos todos. */
export function bindDrag(frame: HTMLElement, handlers: DragHandlers, now = () => performance.now()): () => void {
  let press: Press | null = null;
  let swallowUntil = 0;

  const down = (event: PointerEvent) => {
    if (press || event.button !== 0) return;
    swallowUntil = 0;
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: false, lastX: event.clientX, lastDx: 0, lastAt: now() };
    handlers.onPress();
  };
  const move = (event: PointerEvent) => {
    if (!press || event.pointerId !== press.id) return;
    if (!press.dragging) {
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) < SLOP) return;
      press.dragging = true;
      frame.setPointerCapture(event.pointerId);
      frame.dataset.dragging = 'true';
    }
    [press.lastDx, press.lastX, press.lastAt] = [event.clientX - press.lastX, event.clientX, now()];
    handlers.onDrag(event.clientX - press.x);
  };
  /** Fin del gesto, también si se cancela o se pierde la captura: siempre se libera el puntero. */
  const end = (event: PointerEvent) => {
    if (!press || event.pointerId !== press.id) return;
    const { dragging, lastDx, lastAt } = press;
    press = null;
    if (frame.hasPointerCapture(event.pointerId)) frame.releasePointerCapture(event.pointerId);
    delete frame.dataset.dragging;
    if (dragging) swallowUntil = now() + SWALLOW_MS;
    handlers.onRelease(dragging, dragging ? lastDx : 0, dragging ? now() - lastAt : 0, event.type !== 'pointerup');
  };
  /** En captura: el clic sintético de un arrastre no llega a los botones (el del teclado, detail 0, sí). */
  const click = (event: MouseEvent) => {
    if (event.detail === 0 || now() > swallowUntil) return;
    swallowUntil = 0;
    event.stopPropagation();
    event.preventDefault();
  };

  const pointer = [['pointerdown', down], ['pointermove', move], ['pointerup', end], ['pointercancel', end], ['lostpointercapture', end]] as const;
  for (const [type, listener] of pointer) frame.addEventListener(type, listener);
  frame.addEventListener('click', click, true);
  return () => {
    for (const [type, listener] of pointer) frame.removeEventListener(type, listener);
    frame.removeEventListener('click', click, true);
  };
}
