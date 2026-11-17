// Entrada del usuario sobre el movimiento del reel: arrastre, clic, rueda y teclas. La rueda solo
// suma un impulso limitado (el scroll lo hace el navegador); lo demás es navegación explícita.
import { addImpulse, dragModules, keyAction, wheelImpulse } from './reelInput';
import type { Motion } from './reelMotion';
import { moduleIndex, nearestTurn, settleIndex } from './reelPhase';
import { bindPointer } from './reelPointer';

export interface ControlContext {
  frame: HTMLElement;
  motion: Motion;
  count: number;
  /** Ancho del lienzo en px: da la sensibilidad del arrastre. */
  width(): number;
  reduced(): boolean;
  /** ¿El capítulo tiene recorrido de scroll ahora mismo? */
  travelling(): boolean;
  pick(x: number, y: number): number | null;
  /** Navegación explícita a un índice: mueve el objetivo y lleva el scroll de la página allí. */
  goTo(target: number): void;
  wake(): void;
  onOpen(index: number): void;
}

export interface Controls {
  /** Tecla pulsada con el foco en el reel; devuelve si la usó (y entonces no debe desplazar la página). */
  key(key: string): boolean;
  dispose(): void;
}

export function createControls(context: ControlContext): Controls {
  const { motion, count, goTo, wake, onOpen } = context;
  const centered = () => moduleIndex(motion.target, count);
  let origin = 0;

  const unbind = bindPointer(context.frame, {
    onGrab() {
      origin = motion.target;
      motion.held = true;
      motion.rest = 0;
      wake();
    },
    onDrag(dx, dy) {
      motion.target = origin + dragModules(dx, dy, context.width());
      motion.rest = 0;
      wake();
    },
    onRelease(moved, cancelled) {
      motion.held = false;
      if (moved) motion.target = settleIndex(motion.target); // al soltar asienta en el índice más cercano
      // Si el navegador se quedó el gesto para desplazar la página, su scroll no se toca.
      if (moved && !cancelled) goTo(motion.target);
      else wake();
    },
    onTap(x, y) {
      const hit = context.pick(x, y);
      if (hit === null) return;
      if (hit === centered()) onOpen(hit);
      else goTo(nearestTurn(hit, settleIndex(motion.target), count)); // una vecina: se trae al centro
    },
    onWheel(deltaY, deltaMode) {
      if (!context.reduced()) motion.impulse = addImpulse(motion.impulse, wheelImpulse(deltaY, deltaMode));
    },
  });

  return {
    key(key) {
      const action = keyAction(key, centered(), count, context.travelling());
      if (action === null) return false;
      const here = settleIndex(motion.target);
      if (action === 'open') onOpen(centered());
      else goTo(action === 'home' ? nearestTurn(0, here, count) : here + (action === 'next' ? 1 : -1));
      return true;
    },
    dispose: unbind,
  };
}
