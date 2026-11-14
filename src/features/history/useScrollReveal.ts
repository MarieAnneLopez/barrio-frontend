import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, type RefObject } from 'react';

/**
 * Revela cada hijo [data-reveal] cuando entra en pantalla (una sola vez):
 * opacidad + 16 px de subida, 0,5 s. Cada hito tiene su propio disparador:
 * aparecen según el lector baja, sin cola de espera. Con movimiento reducido
 * no hay animación y todo se ve desde el principio. gsap.context revierte
 * tweens y ScrollTriggers al desmontar o al cambiar los datos.
 */
export function useScrollReveal(root: RefObject<HTMLElement | null>, ready: boolean, reduced: boolean) {
  useLayoutEffect(() => {
    if (!ready || reduced || !root.current) return undefined;
    // Registro en el primer uso, no al importar: idempotente y sin tocar matchMedia antes de tiempo.
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((item) => {
        gsap.from(item, {
          opacity: 0,
          y: 16,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: { trigger: item, start: 'top 85%', once: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, [root, ready, reduced]);
}
