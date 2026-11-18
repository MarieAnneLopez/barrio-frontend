// Motor de la cinta: une el lienzo, el movimiento, la entrada, las zonas de clic y el único rAF.
// Solo dibuja mientras se ve y se mueve; dispose() lo retira todo. Este módulo arrastra three: la
// página lo pide con import() dinámico (ver useRibbon.ts).
import type { RibbonEngine, RibbonItem, RibbonOptions } from './ribbonContract';
import { createControls } from './ribbonControls';
import { createHits } from './ribbonHits';
import { createLoop } from './ribbonLoop';
import { createMotion, stepMotion } from './ribbonMotion';
import { createRibbonView } from './ribbonView';
import { watchRibbon } from './ribbonWatch';
import { nearestIndex } from './ribbonWrap';

/** Distancia al objetivo, en pasos de foto, a la que la cinta ya se da por llegada para anunciarla. */
const ARRIVED = 0.05;

/** Lanza un error si el navegador no da un contexto WebGL: quien lo llama se queda con la rejilla. */
export function createRibbonEngine({ frame, host, onActive, onSettle, onOpen, onLost }: RibbonOptions): RibbonEngine {
  const motion = createMotion();
  const hits = createHits();
  let [items, buttons] = [[] as readonly RibbonItem[], [] as readonly HTMLElement[]];
  let [reduced, active, settled, focused, ring] = [false, 0, 0, -1, false];
  const count = () => Math.max(items.length, 1);
  const view = createRibbonView(host, onLost, () => loop.wake());
  const pitch = () => view.layout.pitch;
  /** Hace el cambio y pide un cuadro. */
  const then = <A extends unknown[]>(change: (...args: A) => void) => (...args: A) => {
    change(...args);
    loop.wake();
  };

  const loop = createLoop((dt) => {
    const moving = stepMotion(motion, dt, reduced);
    hits.place(view.draw(motion.current, ring ? focused : -1), view.layout);
    // Se anuncia al llegar (a un 5 % del paso del objetivo), sin esperar el último píxel del suavizado.
    const near = Math.abs(motion.target - motion.current) < ARRIVED * pitch();
    const here = nearestIndex(motion.target, pitch(), count());
    if (near && !motion.held && here !== settled) {
      settled = here;
      onSettle(here);
    }
    return moving;
  });
  /** El objetivo cambió: la foto activa (la del roving tabindex) es la más cercana a él. */
  const moved = then(() => {
    const next = nearestIndex(motion.target, pitch(), count());
    if (next === active) return;
    active = next;
    onActive(next);
  });
  const controls = createControls({
    frame, motion, count, pitch, moved, onOpen,
    unitsPerPixel: () => view.layout.unitsPerPixel,
    reduced: () => reduced,
    active: () => active,
    focusActive() {
      if (frame.contains(document.activeElement)) buttons[active]?.focus({ preventScroll: true });
    },
    onFocus: then((index: number, visible: boolean) => {
      [focused, ring] = [index, visible];
    }),
  });
  const unwatch = watchRibbon({
    frame,
    onVisible: loop.setVisible,
    onResize: then(() => {
      const before = pitch();
      if (!view.resize()) return;
      motion.current *= pitch() / before; // la misma foto sigue en el centro
      motion.target *= pitch() / before;
    }),
    onTheme: then(() => view.setTheme()),
  });
  view.resize();
  view.setTheme();

  return {
    setItems: then((next: readonly RibbonItem[]) => {
      items = next;
      view.setItems(next);
    }),
    setButtons: then((next: readonly HTMLElement[]) => {
      buttons = next;
      hits.setButtons(next);
    }),
    setReduced: then((next: boolean) => {
      reduced = next;
    }),
    key: controls.key,
    center: controls.center,
    dispose() {
      unwatch();
      loop.dispose();
      controls.dispose();
      view.dispose();
    },
  };
}
