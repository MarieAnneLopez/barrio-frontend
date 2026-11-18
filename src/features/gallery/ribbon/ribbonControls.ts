// Entrada del usuario sobre el movimiento de la cinta: arrastre con lanzamiento, rueda, activación de
// los botones (clic en la centrada: abrir; en una vecina: centrarla) y teclas (flechas y Home).
import { bindInput, keyAction } from './ribbonInput';
import { dragTarget, launchTarget, type Motion, wheelTarget } from './ribbonMotion';
import { bindDrag } from './ribbonPointer';
import { centerOn, stepTarget } from './ribbonWrap';

export interface ControlContext {
  frame: HTMLElement;
  motion: Motion;
  count(): number;
  pitch(): number;
  unitsPerPixel(): number;
  reduced(): boolean;
  /** Foto activa: la más cercana al objetivo. */
  active(): number;
  /** El objetivo cambió: actualiza la foto activa y pide cuadros. */
  moved(): void;
  /** Tras navegar con el teclado, el foco pasa al botón de la nueva foto activa. */
  focusActive(): void;
  onOpen(index: number): void;
  onFocus(index: number, visible: boolean): void;
}

export interface Controls {
  key(key: string): boolean;
  center(index: number): void;
  dispose(): void;
}

export function createControls(context: ControlContext): Controls {
  const { motion, moved } = context;
  let start = 0;
  const center = (index: number) => {
    motion.target = centerOn(index, motion.target, context.pitch(), context.count());
    moved();
  };

  const unbindDrag = bindDrag(context.frame, {
    onPress() {
      [motion.target, start] = [motion.current, motion.current]; // pulsar «atrapa» la cinta donde va
      moved();
    },
    onDrag(dx) {
      motion.held = true;
      motion.target = dragTarget(start, dx, context.unitsPerPixel());
      moved();
    },
    onRelease(dragged, lastDx, sinceMs, cancelled) {
      motion.held = false;
      if (dragged && !cancelled && !context.reduced()) motion.target = launchTarget(motion.target, lastDx, sinceMs, context.unitsPerPixel());
      moved();
    },
  });
  const unbindInput = bindInput(context.frame, {
    onWheel(pixels) {
      if (context.reduced()) return; // la rueda desplaza la página; la cinta solo la acompaña con movimiento
      motion.target = wheelTarget(motion.target, pixels, context.unitsPerPixel());
      moved();
    },
    onActivate(index, keyboard) {
      const centered = index === context.active();
      if (!centered) center(index); // una vecina: por la distancia envuelta más corta
      if (centered || keyboard) context.onOpen(index); // Enter (o un lector de pantalla) abre siempre
    },
    onFocus: context.onFocus,
  });

  return {
    key(key) {
      const action = keyAction(key);
      if (action === null) return false;
      const [pitch, count] = [context.pitch(), context.count()];
      motion.target = action === 'home' ? centerOn(0, motion.target, pitch, count) : stepTarget(motion.target, pitch, action === 'next' ? 1 : -1);
      moved();
      context.focusActive();
      return true;
    },
    center,
    dispose() {
      unbindDrag();
      unbindInput();
    },
  };
}
