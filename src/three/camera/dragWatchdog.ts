// Vigilante de la cámara: si el ratón arrastra con un botón apretado y la cámara no se mueve, los
// controles de three-stdlib quedaron sordos (soltaron el puntero a medias, perdieron sus oyentes del
// documento o guardaron un puntero viejo). Se detecta y se pide rehacerlos; nunca debe pasar a la vista.

/** Lo que debe alejarse el ratón (px) del punto de partida antes de dudar de la cámara. */
export const DEAD_DRAG_PX = 48;
/** Lo que debe durar el arrastre (ms): da tiempo a que la cámara responda. */
export const DEAD_DRAG_MS = 250;
/** Lo que debe moverse la cámara o su objetivo para darla por viva. */
const ALIVE_MOVE = 1e-3;

/** Un arrastre largo y de varios cuadros en el que la cámara no se movió: los controles no responden. */
export const isDeadDrag = (travelledPx: number, elapsedMs: number, moved: number): boolean =>
  travelledPx >= DEAD_DRAG_PX && elapsedMs >= DEAD_DRAG_MS && moved < ALIVE_MOVE;

interface Drag {
  x: number;
  y: number;
  at: number;
  pose: number[];
  reported: boolean;
}

/** Observa los arrastres del ratón sobre `canvas`; `pose()` da posición y objetivo de la cámara; devuelve cómo dejar de observar. */
export function watchDrags(canvas: HTMLElement, pose: () => number[], reset: () => void): () => void {
  let drag: Drag | null = null;
  const down = (e: PointerEvent) => {
    drag = e.pointerType === 'mouse' ? { x: e.clientX, y: e.clientY, at: e.timeStamp, pose: pose(), reported: false } : null;
  };
  const move = (e: PointerEvent) => {
    if (!drag || drag.reported || e.buttons === 0) return;
    const start = drag.pose;
    const moved = Math.max(0, ...pose().map((v, i) => Math.abs(v - (start[i] ?? v))));
    if (!isDeadDrag(Math.hypot(e.clientX - drag.x, e.clientY - drag.y), e.timeStamp - drag.at, moved)) return;
    drag.reported = true;
    reset();
  };
  const end = () => {
    drag = null;
  };
  const blur = () => {
    if (drag && !drag.reported) reset(); // se soltó el botón fuera de la ventana: puede quedar un puntero viejo
    drag = null;
  };
  canvas.addEventListener('pointerdown', down);
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
  window.addEventListener('blur', blur);
  return () => {
    canvas.removeEventListener('pointerdown', down);
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', end);
    document.removeEventListener('pointercancel', end);
    window.removeEventListener('blur', blur);
  };
}
