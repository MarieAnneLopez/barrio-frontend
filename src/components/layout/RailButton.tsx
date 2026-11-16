import type { ReactNode } from 'react';
import { Tooltip } from '../ui/Tooltip';

interface RailButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
  /** Interruptor: aria-pressed. Acción simple: omitir. */
  pressed?: boolean;
  /** Disclosure (plegar/desplegar): aria-expanded + aria-controls. */
  expanded?: boolean;
  controls?: string;
  disabled?: boolean;
}

/** Botón cuadrado de 44 px de la barra de accesibilidad, con tooltip a la izquierda. */
export function RailButton({
  label, onClick, children, pressed, expanded, controls, disabled = false,
}: RailButtonProps) {
  return (
    <Tooltip content={label} side="left" delay={250}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        aria-expanded={expanded}
        aria-controls={controls}
        disabled={disabled}
        onClick={onClick}
        className={`ui-pressable inline-flex size-11 items-center justify-center rounded-sm border ${
          pressed || expanded
            ? 'border-interactive bg-interactive text-on-interactive'
            : 'ui-btn--ghost border-transparent text-fg'
        }`}
      >
        {children}
      </button>
    </Tooltip>
  );
}
