import { useLayoutEffect, type RefObject } from 'react';

/** power2.out en CSS: la misma curva que usaba con GSAP. */
const EASE = 'cubic-bezier(0.5, 1, 0.89, 1)';
const FROM: Keyframe = { opacity: 0, transform: 'scaleY(0)' };

function hide(item: HTMLElement) {
  item.style.opacity = '0';
  item.style.transform = 'scaleY(0)';
}

function show(item: HTMLElement) {
  item.style.opacity = '';
  item.style.transform = '';
}

/**
 * Dibuja el tramo vertical de cada hito al entrar en pantalla. El texto siempre está visible.
 * Con movimiento reducido no hay animación y todo se ve desde el principio. Sin GSAP: un
 * IntersectionObserver y una animación nativa del navegador (WAAPI, fuera del hilo principal);
 * Historia va en el paquete inicial (H27) y así no lo engorda (gran actualización, rendimiento).
 */
export function useScrollReveal(root: RefObject<HTMLElement | null>, ready: boolean, reduced: boolean) {
  useLayoutEffect(() => {
    const node = root.current;
    if (!ready || reduced || !node || typeof IntersectionObserver !== 'function') return undefined;
    const items = Array.from(node.querySelectorAll<HTMLElement>('[data-reveal]'));
    const lines = new Map(items.map((item) => [item, item.querySelector<HTMLElement>('[data-reveal-line]')]));
    const running: Animation[] = [];
    // El hito ya está a la vista cuando su borde de arriba pasa el 85 % de la altura de la ventana.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ isIntersecting, target, boundingClientRect }) => {
          // Al volver a una página ya bajada, lo que quedó arriba se muestra quieto, como hacía ScrollTrigger.
          const passed = boundingClientRect.bottom < 0;
          if ((!isIntersecting && !passed) || !(target instanceof HTMLElement)) return;
          observer.unobserve(target);
          const line = lines.get(target);
          if (!line) return;
          show(line);
          if (passed) return;
          const animation = line.animate?.([FROM, { opacity: 1, transform: 'none' }], { duration: 500, easing: EASE });
          if (animation) running.push(animation);
        });
      },
      { rootMargin: '0px 0px -15% 0px' },
    );
    lines.forEach((line, item) => {
      if (!line) return;
      hide(line); // antes de pintar: sin parpadeo
      observer.observe(item);
    });
    return () => {
      observer.disconnect();
      running.forEach((animation) => animation.cancel());
      lines.forEach((line) => { if (line) show(line); });
    };
  }, [root, ready, reduced]);
}
