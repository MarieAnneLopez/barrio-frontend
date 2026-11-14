import { useTranslation } from 'react-i18next';

interface SpinnerProps {
  /** Tamaño en px. */
  size?: number;
  /** Texto para lectores de pantalla; `null` si el contenedor ya lo anuncia. */
  label?: string | null;
  className?: string;
}

/** Indicador de carga local, en currentColor. */
export function Spinner({ size = 16, label, className = '' }: SpinnerProps) {
  const { t } = useTranslation();
  const text = label === undefined ? t('ui.loading') : label;
  return (
    <span className={`inline-flex items-center ${className}`} role={text ? 'status' : undefined}>
      <svg
        className="ui-spinner"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {text ? <span className="sr-only">{text}</span> : null}
    </span>
  );
}
