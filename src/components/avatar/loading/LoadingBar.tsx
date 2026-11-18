import './loading-bar.css';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { settled, springStep, START, type Spring } from './progressSpring';

interface LoadingBarProps {
  /** Objetivo del relleno (0–1): el progreso real, que nunca retrocede. */
  target: number;
  reduced: boolean;
  /** Lo que viaja con la punta del relleno (la Mini Marie pequeña); recibe el avance mostrado. */
  rider?: (shown: number) => ReactNode;
}

const SPARKS = [0, 1, 2, 3, 4];

/**
 * Barra de carga viva (gran actualización; diseños): el relleno sigue el progreso real con un
 * muelle suave (progressSpring), un brillo la recorre y unas chispas amarillas saltan de la punta.
 * Todo es transform y opacity: el relleno se corre con translateX y la punta viaja en un riel del
 * ancho de la barra. Un solo rAF que se suelta al llegar y al desmontar. Con movimiento reducido,
 * el relleno va directo al objetivo, sin brillo ni chispas.
 */
export function LoadingBar({ target, reduced, rider }: LoadingBarProps) {
  const { t } = useTranslation();
  const fill = useRef<HTMLSpanElement>(null);
  const rail = useRef<HTMLSpanElement>(null);
  const spring = useRef<Spring>({ x: START, v: 0 });
  const [shown, setShown] = useState(START);

  useEffect(() => {
    const paint = (x: number) => {
      if (fill.current) fill.current.style.transform = `translate3d(${(x - 1) * 100}%, 0, 0)`;
      if (rail.current) rail.current.style.transform = `translate3d(${x * 100}%, 0, 0)`;
      setShown((before) => (Math.round(before * 100) === Math.round(x * 100) ? before : x));
    };
    if (reduced) {
      spring.current = { x: target, v: 0 };
      paint(target);
      return undefined;
    }
    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      spring.current = springStep(spring.current, target, last ? (now - last) / 1000 : 0);
      last = now;
      const done = settled(spring.current, target);
      if (done) spring.current = { x: target, v: 0 }; // al asentarse queda exacto
      paint(spring.current.x);
      frame = done ? 0 : requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);

  const percent = Math.round(shown * 100);
  return (
    <div
      role="progressbar"
      aria-label={t('loading.progress')}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      data-reduced={reduced || undefined}
      className="loading-bar"
    >
      <span className="loading-bar__track">
        <span ref={fill} className="loading-bar__fill" />
      </span>
      <span ref={rail} className="loading-bar__rail" aria-hidden="true">
        <span className="loading-bar__head">
          {reduced ? null : SPARKS.map((spark) => <span key={spark} className="loading-bar__spark" />)}
          {rider ? rider(shown) : null}
        </span>
      </span>
    </div>
  );
}
