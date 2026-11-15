import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, type RefObject } from 'react';

/**
 * Galería (H32, D68): los [data-reveal] que entran juntos en pantalla forman un lote
 * y aparecen una sola vez en ola: opacidad + 12 px, 0,45 s, con un escalonado que se
 * acorta (total ≤ 240 ms, nunca uniforme). Con movimiento reducido no se anima nada.
 * gsap.context revierte estados, tweens y ScrollTriggers al desmontar.
 */
export function useBatchReveal(root: RefObject<HTMLElement | null>, ready: boolean, reduced: boolean) {
  useLayoutEffect(() => {
    if (!ready || reduced || !root.current) return undefined;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('[data-reveal]');
      gsap.set(items, { opacity: 0, y: 12 });
      ScrollTrigger.batch(items, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.45,
            ease: 'power3.out',
            stagger: { amount: Math.min(0.24, 0.06 * (batch.length - 1)), ease: 'power1.out' },
          }),
      });
    }, root);
    return () => ctx.revert();
  }, [root, ready, reduced]);
}
