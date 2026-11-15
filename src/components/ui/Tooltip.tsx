import { cloneElement, useEffect, useId, useRef, useState, type ReactElement } from 'react';

type Side = 'top' | 'right' | 'bottom' | 'left';

interface TooltipProps {
  content: string;
  side?: Side;
  /** Retraso de apertura en ms (para no activarlo por accidente). */
  delay?: number;
  children: ReactElement<{ 'aria-describedby'?: string }>;
}

const POSITION: Record<Side, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2 origin-bottom',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2 origin-top',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2 origin-right',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2 origin-left',
};

/** Si otro tooltip se cerró hace menos de esto, el siguiente abre al instante (grupo «caliente», H26). */
export const WARM_MS = 300;
let lastClosedAt = -Infinity;

/**
 * Tooltip accesible por hover y teclado; Escape lo cierra. Escala desde su disparador.
 * Al recorrer botones vecinos (barra de accesibilidad, menú plegado) solo el primero
 * espera: los demás aparecen sin demora ni transición.
 */
export function Tooltip({ content, side = 'top', delay = 400, children }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [instant, setInstant] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = (wait: number) => {
    window.clearTimeout(timer.current);
    const warm = performance.now() - lastClosedAt < WARM_MS;
    setInstant(warm);
    timer.current = window.setTimeout(() => setOpen(true), warm ? 0 : wait);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    if (open) lastClosedAt = performance.now();
    setOpen(false);
  };

  return (
    <span
      className="relative inline-flex"
      onPointerEnter={() => show(delay)}
      onPointerLeave={hide}
      onFocus={() => show(0)}
      onBlur={hide}
      onKeyDown={(event) => event.key === 'Escape' && hide()}
    >
      {cloneElement(children, { 'aria-describedby': id })}
      <span
        id={id}
        role="tooltip"
        data-open={open}
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-sm border border-line bg-surface px-2 py-1 text-step--1 text-fg shadow-[var(--shadow-deep)] transition-[opacity,transform] ease-[var(--ease-emphasis)] ${instant ? 'duration-0' : 'duration-[var(--dur-2)]'} ${POSITION[side]} ${open ? 'scale-100 opacity-100' : 'invisible scale-[0.97] opacity-0'}`}
      >
        {content}
      </span>
    </span>
  );
}
