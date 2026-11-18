import { useEffect, useState, type RefObject } from 'react';

/**
 * true cuando el elemento está a `margin` de entrar en pantalla (y desde entonces, siempre). Sirve para
 * no bajar recursos pesados del pie de página en la primera carga: el `loading="lazy"` nativo los pide
 * con más de 1000 px de antelación, y en una página corta eso es al arrancar. Sin `enabled`, o sin
 * IntersectionObserver, es true desde el principio.
 */
export function useNearViewport(ref: RefObject<Element | null>, enabled: boolean, margin = '300px'): boolean {
  const [near, setNear] = useState(() => !enabled || typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const node = ref.current;
    if (near || !node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: margin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [near, ref, margin]);
  return near;
}
