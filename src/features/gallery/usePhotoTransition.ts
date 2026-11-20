import { useLayoutEffect, useRef, type RefObject } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export type Thumbnail = (index: number) => Element | null | undefined;

/** Expresa el rectángulo de la miniatura en el sistema de coordenadas de la foto ampliada. */
function thumbnailFrame(image: HTMLElement, thumbnail?: Element | null): Keyframe | null {
  const source = thumbnail?.getBoundingClientRect();
  const target = image.getBoundingClientRect();
  if (!source?.width || !source.height || !target.width || !target.height) return null;
  if (source.bottom <= 0 || source.top >= window.innerHeight || source.right <= 0 || source.left >= window.innerWidth) return null;
  const dx = source.left + source.width / 2 - target.left - target.width / 2;
  const dy = source.top + source.height / 2 - target.top - target.height / 2;
  return { transform: `translate(${dx}px, ${dy}px) scale(${source.width / target.width}, ${source.height / target.height})` };
}

/** Entrada desde la miniatura visible y salida a la foto actual, también al recorrer el visor con el teclado. */
export function usePhotoTransition(
  image: RefObject<HTMLImageElement>, index: number | null, thumbnail: Thumbnail | undefined, dismiss: () => void,
) {
  const reduced = useReducedMotion();
  const running = useRef<Animation | null>(null);
  const closing = useRef(false);
  const open = index !== null;
  const latest = useRef({ index, thumbnail, dismiss });
  useLayoutEffect(() => { latest.current = { index, thumbnail, dismiss }; });
  useLayoutEffect(() => {
    const element = image.current;
    if (!open || reduced || !element) return;
    const initial = latest.current.index;
    const enter = () => {
      if (initial === null || latest.current.index !== initial || typeof element.animate !== 'function') return;
      const first = thumbnailFrame(element, latest.current.thumbnail?.(initial));
      if (first) running.current = element.animate([first, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.75,.25,1)' });
    };
    if (element.complete) enter();
    else element.addEventListener('load', enter, { once: true });
    return () => {
      element.removeEventListener('load', enter);
      running.current?.cancel();
      running.current = null;
    };
  }, [image, open, reduced]);
  useLayoutEffect(() => {
    if (!open || reduced) {
      if (open && closing.current) latest.current.dismiss();
      closing.current = false;
    }
  }, [open, reduced]);

  return () => {
    if (closing.current) return;
    const element = image.current;
    if (reduced || !element || index === null || typeof element.animate !== 'function') return dismiss();
    running.current?.cancel();
    const last = thumbnailFrame(element, thumbnail?.(index));
    if (!last) return dismiss();
    const exit = element.animate([{ transform: 'none' }, last], {
      duration: 160, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'forwards',
    });
    closing.current = true;
    running.current = exit;
    exit.onfinish = () => {
      closing.current = false;
      latest.current.dismiss();
    };
  };
}
