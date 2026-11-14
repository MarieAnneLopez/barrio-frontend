import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';
import { useA11yStore } from '../../store/a11yStore';

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
  const reduced = useA11yStore((s) => s.reducedMotion);

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
