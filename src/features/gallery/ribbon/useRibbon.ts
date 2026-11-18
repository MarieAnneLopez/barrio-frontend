import { type KeyboardEvent, type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { canCreateWebGL, type RibbonEngine, type RibbonItem, supportsWebGL } from './ribbonContract';
import { useFocusCarry } from './ribbonFocus';

type ElementRef = RefObject<HTMLElement | null>;
/** grid: sin WebGL, queda la rejilla · pending: el motor aún no llegó, se ve la rejilla · ribbon: la cinta. */
export type RibbonMode = 'grid' | 'pending' | 'ribbon';
/** Margen con el que se pide el motor: una pantalla antes de que la cinta asome. */
const NEAR = '100% 0px';

interface Args {
  /** La sección (para saber si está cerca), el contenedor de la cinta y el del lienzo. */
  root: ElementRef;
  frame: ElementRef;
  host: ElementRef;
  items: readonly RibbonItem[];
  reduced: boolean;
  onOpen(index: number): void;
}

/**
 * Vida de la cinta dentro de React. El motor WebGL (y three con él) no va en el trozo de la página:
 * se pide con import() cuando la cinta está cerca de la pantalla, solo si el navegador da un contexto
 * WebGL 2, y se destruye al desmontar. Mientras tanto, y si no hay WebGL o falla, queda la rejilla.
 */
export function useRibbon({ root, frame, host, items, reduced, onOpen }: Args) {
  const engine = useRef<RibbonEngine | null>(null);
  const latest = useRef({ items, reduced, onOpen });
  const [supported, setSupported] = useState(supportsWebGL);
  const [wanted, setWanted] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0);
  const [settled, setSettled] = useState(0);
  const mode: RibbonMode = !supported ? 'grid' : ready ? 'ribbon' : 'pending';
  const request = useCallback(() => (canCreateWebGL() ? setWanted(true) : setSupported(false)), []);
  const center = useCallback((index: number, instant = false) => engine.current?.center(index, instant), []);
  const carry = useFocusCarry(root, mode, center);

  // Va antes que el efecto que crea el motor: deja a mano lo último y, si ya existe, se lo pasa.
  useEffect(() => {
    latest.current = { items, reduced, onOpen };
    engine.current?.setItems(items);
    engine.current?.setReduced(reduced);
  }, [items, reduced, onOpen]);

  useEffect(() => {
    if (!supported || wanted || !root.current) return undefined;
    const near = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) request();
    }, { rootMargin: NEAR });
    near.observe(root.current);
    return () => near.disconnect();
  }, [supported, wanted, root, request]);

  useEffect(() => {
    if (!supported || !wanted) return undefined;
    let cancelled = false;
    let started: RibbonEngine | null = null;
    void import('./ribbonEngine')
      .then(({ createRibbonEngine }) => {
        if (cancelled || !frame.current || !host.current) return;
        started = createRibbonEngine({
          frame: frame.current, host: host.current, onActive: setActive, onSettle: setSettled,
          onOpen: (index) => latest.current.onOpen(index),
          onLost: () => {
            carry(root.current, 'data-ribbon-index'); // el foco pasará a la tesela de la misma foto, no al body
            setSupported(false);
          },
        });
        started.setItems(latest.current.items);
        started.setReduced(latest.current.reduced);
        engine.current = started;
        carry(root.current, 'data-grid-index'); // si estaba en una tesela, la cinta empieza en esa foto, con el foco
        setReady(true);
      })
      .catch(() => !cancelled && setSupported(false)); // sin contexto WebGL o sin red: queda la rejilla
    return () => {
      cancelled = true;
      started?.dispose();
      engine.current = null;
    };
  }, [supported, wanted, root, frame, host, carry]);

  // Los botones existen cuando la cinta ya se ve: se le pasan al motor, que los coloca sobre las fotos.
  useEffect(() => {
    if (mode === 'ribbon' && frame.current) engine.current?.setButtons([...frame.current.querySelectorAll<HTMLElement>('[data-ribbon-index]')]);
  }, [mode, items, frame]);

  /** Flechas y Home son de la cinta; lo demás (y los atajos con Alt, Ctrl o ⌘) sigue siendo del navegador. */
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !(event.target instanceof Node)) return;
    if (frame.current?.contains(event.target) && engine.current?.key(event.key)) event.preventDefault();
  };
  return { mode, active, settled, onKeyDown, center };
}
