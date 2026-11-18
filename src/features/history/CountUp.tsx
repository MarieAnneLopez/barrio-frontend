import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface CountUpProps {
  value: number;
  format: (n: number) => string;
  decimals?: number;
}

const DURATION_MS = 1200;
/** power2.out, la curva de GSAP que usaba antes: arranca rápido y frena al llegar. */
const easeOut = (t: number) => 1 - (1 - t) ** 2;

/**
 * Número que sube desde 0 (1,2 s, power2.out). Escribe en el DOM por ref en cada cuadro, sin
 * re-render; el lector de pantalla oye solo el valor final (sr-only) y con movimiento reducido se
 * ve el valor final de entrada. Va con requestAnimationFrame y sin GSAP: Historia está en el
 * paquete inicial (H27) y así no arrastra la librería (gran actualización, rendimiento).
 */
export function CountUp({ value, format, decimals = 0 }: CountUpProps) {
  const visible = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion(); // barra de accesibilidad o sistema (H30)

  useLayoutEffect(() => {
    const node = visible.current;
    if (!node || reduced) return undefined;
    const factor = 10 ** decimals;
    let start: number | null = null;
    let frame = 0;
    const tick = (now: number) => {
      start ??= now;
      const t = Math.min(1, (now - start) / DURATION_MS);
      node.textContent = format(Math.round(value * easeOut(t) * factor) / factor);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    node.textContent = format(0);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
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
