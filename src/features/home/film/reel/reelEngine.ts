// Motor del reel: une el lienzo, el movimiento, la entrada y el único rAF. El scroll nativo del
// capítulo (200svh de recorrido) fija el objetivo; la navegación explícita lo mueve a mano y luego
// lleva la página al punto que corresponde. Solo dibuja mientras se ve; dispose() lo retira todo.
// Este módulo arrastra three: el componente lo pide con import() dinámico (ver useModuleReel.ts).
import type { Cover } from './coverLayout';
import type { ReelEngine, ReelOptions } from './reelContract';
import { createControls } from './reelControls';
import { createLoop } from './reelLoop';
import { bendOf, createMotion, stepMotion, tiltOf } from './reelMotion';
import { moduleIndex, settleIndex } from './reelPhase';
import { createFollower, readTravel, syncScroll } from './reelTravel';
import { createReelView } from './reelView';
import { watchReel } from './reelWatch';

/** Lanza un error si el navegador no da un contexto WebGL: quien lo llama se queda entonces con la rejilla. */
export function createReelEngine({ section, stage, frame, count, onIndex, onOpen, onLost }: ReelOptions): ReelEngine {
  const view = createReelView(frame, stage, count, onLost);
  const motion = createMotion();
  const follow = createFollower(section, stage, motion, count);
  let covers: readonly Cover[] = [];
  let [reduced, fontReady, shown] = [false, false, -1];

  const loop = createLoop((dt) => {
    if (!reduced) follow();
    stepMotion(motion, dt, reduced);
    view.draw(motion.phase, bendOf(motion), tiltOf(motion), motion.time);
    const index = moduleIndex(motion.phase, count);
    if (index !== shown) {
      shown = index;
      onIndex(index);
    }
    return !reduced; // con movimiento reducido no hay nada autónomo: un cuadro por entrada
  });
  /** Las portadas se pintan con la display ya cargada; si no, saldrían con la tipografía de respaldo. */
  const paint = () => {
    if (fontReady) view.setCovers(covers);
    loop.wake();
  };
  const controls = createControls({
    frame, motion, count, onOpen, pick: view.pick, width: view.width, wake: loop.wake,
    reduced: () => reduced,
    travelling: () => !reduced && readTravel(section, stage).travel > 0,
    goTo(target) {
      motion.target = target;
      motion.rest = 0;
      if (!reduced) syncScroll(section, stage, target, count);
      loop.wake();
    },
  });
  const unwatch = watchReel({
    frame, section, onVisible: loop.setVisible, onTheme: paint,
    onResize() {
      view.resize();
      loop.wake();
    },
    onFont() {
      fontReady = true;
      paint();
    },
  });
  view.resize();

  return {
    setCovers(next) {
      covers = next;
      paint();
    },
    setReduced(next) {
      reduced = next;
      if (next) motion.target = settleIndex(motion.target);
      loop.wake();
    },
    key: controls.key,
    dispose() {
      unwatch();
      loop.dispose();
      controls.dispose();
      view.dispose();
    },
  };
}
