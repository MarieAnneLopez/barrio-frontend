import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { cardTarget, isOnScreen } from './hinge/cardProgress';

const HingePanelCanvas = lazy(() => import('./hinge/HingePanelCanvas'));

type TimelineStageProps = { year: string; onUnavailable: () => void };

/**
 * Cubierta HINGE de una tarjeta: 12 piezas que se abren en cascada al subir la tarjeta por la pantalla
 * y se vuelven a cerrar al bajar. Solo capa visual (aria-hidden, sin eventos): el contenido sigue
 * siendo el HTML de la tarjeta. El lienzo existe solo cerca de la pantalla y mientras haya cubierta;
 * abierta y quieta, se desmonta y libera la GPU.
 */
export function TimelineStage({ year, onUnavailable }: TimelineStageProps) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [start, setStart] = useState<number | null>(null); // null = sin lienzo
  const card = host?.parentElement ?? null;
  const rest = useCallback(() => setStart(null), []);

  useEffect(() => {
    if (!card || typeof IntersectionObserver !== 'function') return undefined;
    let near = false;
    let first = true; // al cargar no se anima el cierre: la tarjeta aparece ya en su estado
    const wake = () => {
      if (!near) return;
      const target = cardTarget(card, 1); // sin lienzo, la tarjeta está abierta
      // Si ya se veía abierta en pantalla, el giro (inverso) arranca desde 1: sin saltos.
      if (target < 1) setStart((current) => current ?? (!first && isOnScreen(card) ? 1 : target));
      first = false;
    };
    const observer = new IntersectionObserver((entries) => {
      near = entries[entries.length - 1]?.isIntersecting ?? false;
      if (near) wake();
      else setStart(null);
    }, { rootMargin: '50% 0px 50% 0px' });
    observer.observe(card);
    window.addEventListener('scroll', wake, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', wake);
    };
  }, [card]);

  return (
    <div ref={setHost} aria-hidden="true" data-hinge-cover
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {card && start !== null ? (
        <Suspense fallback={null}>
          <HingePanelCanvas card={card} year={year} start={start} onRest={rest} onUnavailable={onUnavailable}
            className="size-full" />
        </Suspense>
      ) : null}
    </div>
  );
}
