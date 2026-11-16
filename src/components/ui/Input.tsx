import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Etiqueta visible (nunca solo placeholder). */
  label: string;
  hint?: string;
  /** Mensaje de error junto al campo; activa aria-invalid. */
  error?: string | undefined;
  /** Validación o búsqueda en curso. */
  loading?: boolean;
}

/** Campo de texto con etiqueta, ayuda, error y los 5 estados. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, loading = false, id, className = '', ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={inputId} className="text-step--1 font-medium text-fg-secondary">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          {...rest}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-busy={loading || undefined}
          className="ui-field min-h-11 w-full rounded-sm border border-ink bg-stone px-3 text-step-0 text-on-stone placeholder:text-on-stone placeholder:opacity-80"
        />
        {loading ? (
          <Spinner size={16} className="absolute top-1/2 right-3 -translate-y-1/2 text-on-stone" />
        ) : null}
      </div>
      {hint ? (
        <p id={hintId} className="text-step--1 text-fg-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-step--1 text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
});
