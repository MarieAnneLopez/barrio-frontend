import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Star } from './Stars';
import { StateIcon } from './StateIcon';

const STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

interface StarsInputProps {
  value: number | undefined;
  onChange: (value: number) => void;
  legend: string;
  error?: string | undefined;
}

/**
 * Selector de 0,5 a 5 estrellas: diez radios nativos (flechas del teclado,
 * lectores de pantalla) sobre cinco estrellas; cada estrella tiene dos mitades.
 * La estrella elegida rebota con un resorte en CSS (stars.css).
 */
export function StarsInput({ value, onChange, legend, error }: StarsInputProps) {
  const { t, i18n } = useTranslation();
  const name = useId();
  const errorId = `${name}-error`;
  const format = (n: number) => n.toLocaleString(i18n.language === 'en' ? 'en-US' : 'es-CO');

  return (
    <fieldset className="m-0 border-0 p-0" aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 p-0 text-step--1 text-fg-secondary">{legend}</legend>
      {/* Superficie crema propia, como Stars: sobre rosa claro las estrellas no se distinguirían. */}
      <div className="stars-input flex w-fit items-center gap-0.5 rounded-sm bg-surface">
        {[0, 1, 2, 3, 4].map((star) => (
          <span key={star} className="relative inline-flex" data-on={value !== undefined && value > star}>
            <Star size={32} fill={value === undefined ? 0 : Math.min(1, Math.max(0, value - star))} />
            {STEPS.slice(star * 2, star * 2 + 2).map((step, half) => (
              <label key={step} className={`absolute inset-y-0 w-1/2 cursor-pointer ${half ? 'right-0' : 'left-0'}`}>
                <input
                  type="radio"
                  name={name}
                  value={step}
                  checked={value === step}
                  onChange={() => onChange(step)}
                  className="stars-radio"
                />
                <span className="sr-only">{t('ratings.starsValue', { value: format(step) })}</span>
              </label>
            ))}
          </span>
        ))}
        <span className="ml-2 font-mono text-step--1 text-fg-secondary" aria-hidden="true">
          {value === undefined ? '–' : format(value)}
        </span>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1 mb-0 text-step--1 text-error">
          <StateIcon kind="error" />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
