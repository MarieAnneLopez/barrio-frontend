import { type KeyboardEvent, type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, categoryPath } from '../../../../lib/categoryConfig';
import type { Cover } from './coverLayout';
import { canCreateWebGL, type ReelEngine, supportsWebGL } from './reelContract';

type Node = RefObject<HTMLElement | null>;
/** grid: sin WebGL, queda la rejilla · pending: el motor aún no llegó, se ve la rejilla · reel: el lienzo. */
export type ReelMode = 'grid' | 'pending' | 'reel';
/** Margen con el que se pide el motor: una pantalla antes de que el capítulo asome. */
const NEAR = '100% 0px';

/**
 * Vida del reel dentro de React. El motor WebGL (y three con él) no va en el trozo inicial: se pide
 * con import() cuando el capítulo está cerca de la pantalla o alguien lo toca, se crea al llegar y se
 * destruye al desmontar. Mientras tanto, y si no hay WebGL o falla, el componente muestra la rejilla.
 * Recibe los nodos de la sección, de su pantalla sticky y del contenedor del lienzo.
 */
export function useModuleReel(section: Node, stage: Node, frame: Node, covers: readonly Cover[], reduced: boolean) {
  const engine = useRef<ReelEngine | null>(null);
  const refocus = useRef(false);
  const navigate = useNavigate();
  const latest = useRef({ covers, reduced, navigate });
  const [supported, setSupported] = useState(supportsWebGL);
  const [wanted, setWanted] = useState(false);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const mode: ReelMode = !supported ? 'grid' : ready ? 'reel' : 'pending';
  /** Pide el motor si el navegador da de verdad un contexto WebGL; si no, queda la rejilla sin descargar nada. */
  const request = useCallback(() => (canCreateWebGL() ? setWanted(true) : setSupported(false)), []);

  // Va antes que el efecto que crea el motor: deja a mano lo último y, si ya existe, se lo pasa.
  useEffect(() => {
    latest.current = { covers, reduced, navigate };
    engine.current?.setCovers(covers);
    engine.current?.setReduced(reduced);
  }, [covers, reduced, navigate]);

  useEffect(() => {
    if (!supported || wanted || !section.current) return undefined;
    const near = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) request();
    }, { rootMargin: NEAR });
    near.observe(section.current);
    return () => near.disconnect();
  }, [supported, wanted, section, request]);

  useEffect(() => {
    if (!supported || !wanted) return undefined;
    let cancelled = false;
    let started: ReelEngine | null = null;
    void import('./reelEngine')
      .then(({ createReelEngine }) => {
        if (cancelled || !section.current || !stage.current || !frame.current) return;
        started = createReelEngine({
          section: section.current,
          stage: stage.current,
          frame: frame.current,
          count: CATEGORIES.length,
          onIndex: setIndex,
          onOpen: (at) => {
            const category = CATEGORIES[at];
            if (category) void latest.current.navigate(categoryPath(category.slug));
          },
          onLost: () => setSupported(false),
        });
        started.setCovers(latest.current.covers);
        started.setReduced(latest.current.reduced);
        engine.current = started;
        refocus.current = section.current.contains(document.activeElement);
        setReady(true);
      })
      .catch(() => !cancelled && setSupported(false)); // sin contexto WebGL o sin red: queda la rejilla
    return () => {
      cancelled = true;
      started?.dispose();
      engine.current = null;
    };
  }, [supported, wanted, section, stage, frame]);

  // Si el foco estaba en un enlace de la rejilla cuando llegó el motor, pasa al reel en vez de perderse.
  useEffect(() => {
    if (ready && refocus.current) frame.current?.focus({ preventScroll: true });
    refocus.current = false;
  }, [ready, frame]);

  /** Flechas, Home y Enter son del reel; lo demás (y los atajos con Alt, Ctrl o ⌘) sigue siendo del navegador. */
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    if (engine.current?.key(event.key)) event.preventDefault();
  };

  /** El primer gesto dentro del capítulo también pide el motor (solo mientras no se haya pedido). */
  const need = mode === 'pending' && !wanted ? request : undefined;
  return { mode, index, focused, onKeyDown, need, onFocus: () => setFocused(true), onBlur: () => setFocused(false) };
}
