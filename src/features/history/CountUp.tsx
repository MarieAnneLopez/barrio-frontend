import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface CountUpProps {
  value: number;
  format: (n: number) => string;
  decimals?: number;
}

/**
 * Número que sube desde 0 (1,2 s, power2.out). La animación escribe en el DOM
 * por ref, sin re-render por cuadro; el lector de pantalla oye solo el valor
 * final (sr-only) y con movimiento reducido se ve el valor final de entrada.
 */
export function CountUp({ value, format, decimals = 0 }: CountUpProps) {
  const visible = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion(); // barra de accesibilidad o sistema (H30)

  useLayoutEffect(() => {
    const node = visible.current;
    if (!node || reduced) return undefined;
    const counter = { n: 0 };
    const factor = 10 ** decimals;
    const tween = gsap.to(counter, {
      n: value,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: () => {
        node.textContent = format(Math.round(counter.n * factor) / factor);
      },
    });
    return () => {
      tween.kill();
      node.textContent = format(value);
    };
  }, [value, format, decimals, reduced]);

  return (
    <>
      <span ref={visible} aria-hidden="true">{format(value)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
