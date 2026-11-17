// Oyentes del puntero y de la rueda sobre el contenedor del lienzo. El scroll es siempre el nativo:
// la rueda se escucha en pasivo y nada se cancela; el CSS (touch-action: pan-y) deja al navegador
// los gestos verticales del dedo, que llegan aquí como «pointercancel».

export interface PointerHandlers {
  /** Empieza a pulsar: todavía no se sabe si es un clic o un arrastre. */
  onGrab(): void;
  /** Arrastre: desplazamiento en px desde donde se pulsó. */
  onDrag(dx: number, dy: number): void;
  /**
   * Fin del gesto. `moved` dice si hubo arrastre y `cancelled`, si el navegador se lo quedó (el dedo
   * en vertical desplaza la página): entonces no era un arrastre del reel.
   */
  onRelease(moved: boolean, cancelled: boolean): void;
  /** Clic sin arrastre, en coordenadas del lienzo: −1 … 1, con la y hacia arriba. */
  onTap(x: number, y: number): void;
  onWheel(deltaY: number, deltaMode: number): void;
}

/** Por debajo de esto, mover el puntero es un temblor del clic y no un arrastre (px). */
const SLOP = 6;

/** Conecta los oyentes y devuelve cómo retirarlos todos. */
export function bindPointer(element: HTMLElement, handlers: PointerHandlers): () => void {
  let grab: { id: number; x: number; y: number; moved: boolean } | null = null;
  let dragged = false;

  const down = (event: PointerEvent) => {
    if (grab || event.button !== 0) return;
    grab = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    dragged = false;
    element.setPointerCapture(event.pointerId);
    handlers.onGrab();
  };
  const move = (event: PointerEvent) => {
    if (!grab || event.pointerId !== grab.id) return;
    const [dx, dy] = [event.clientX - grab.x, event.clientY - grab.y];
    if (!grab.moved && Math.hypot(dx, dy) < SLOP) return;
    grab.moved = true;
    dragged = true;
    element.dataset.dragging = 'true';
    handlers.onDrag(dx, dy);
  };
  /** Fin del gesto, también si se cancela o se pierde la captura: siempre se libera el puntero. */
  const end = (event: PointerEvent) => {
    if (!grab || event.pointerId !== grab.id) return;
    const { moved } = grab;
    grab = null;
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    delete element.dataset.dragging;
    handlers.onRelease(moved, event.type !== 'pointerup');
  };
  const click = (event: MouseEvent) => {
    if (dragged) {
      dragged = false; // el clic que cierra un arrastre no abre nada
      return;
    }
    const box = element.getBoundingClientRect();
    // Teclado o lector de pantalla (detail 0): no hay posición, vale el centro.
    if (event.detail === 0 || box.width === 0 || box.height === 0) handlers.onTap(0, 0);
    else handlers.onTap(((event.clientX - box.left) / box.width) * 2 - 1, 1 - ((event.clientY - box.top) / box.height) * 2);
  };
  const wheel = (event: WheelEvent) => handlers.onWheel(event.deltaY, event.deltaMode);

  const pointerEvents = [['pointerdown', down], ['pointermove', move], ['pointerup', end], ['pointercancel', end], ['lostpointercapture', end]] as const;
  for (const [type, listener] of pointerEvents) element.addEventListener(type, listener);
  element.addEventListener('click', click);
  element.addEventListener('wheel', wheel, { passive: true });

  return () => {
    for (const [type, listener] of pointerEvents) element.removeEventListener(type, listener);
    element.removeEventListener('click', click);
    element.removeEventListener('wheel', wheel);
  };
}
