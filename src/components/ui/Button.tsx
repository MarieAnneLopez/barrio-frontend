import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Estado loading: muestra spinner, anuncia aria-busy y bloquea el clic. */
  loading?: boolean;
  icon?: ReactNode;
}

const VARIANT: Record<Variant, string> = {
  primary: 'ui-btn--primary bg-interactive text-on-interactive border-interactive',
  // De contorno sobre noche; dentro de un tono papel queda como botón oscuro (tone.css).
  secondary: 'ui-btn--secondary bg-surface text-fg border-line-strong',
  ghost: 'ui-btn--ghost bg-transparent text-fg border-transparent',
};

const SIZE: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-step--1 gap-2',
  md: 'min-h-11 px-4 text-step-0 gap-2',
};

/** Botón con los 5 estados: hover, focus-visible, active, disabled y loading. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, icon, children, className = '', onClick, ...rest },
  ref,
) {
  const inactive = Boolean(disabled) || loading;
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      disabled={disabled}
      aria-disabled={inactive || undefined}
      aria-busy={loading || undefined}
      onClick={inactive ? undefined : onClick}
      className={`ui-pressable inline-flex select-none items-center justify-center rounded-sm border font-medium ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    >
      {loading ? <Spinner size={16} label={null} /> : icon}
      {children}
    </button>
  );
});
