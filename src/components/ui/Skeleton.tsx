import { useTranslation } from 'react-i18next';

interface SkeletonProps {
  /** Clases de tamaño/forma (p. ej. "h-4 w-32"). */
  className?: string;
  /** Número de líneas a mostrar. */
  lines?: number;
}

/** Marcador de carga para contenido: reserva el espacio y evita saltos. */
export function Skeleton({ className = 'h-4 w-full', lines = 1 }: SkeletonProps) {
  const { t } = useTranslation();
  return (
    <div role="status" aria-busy="true" aria-label={t('ui.loading')} className="flex flex-col gap-2">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={`ui-skeleton rounded-sm ${className}`} />
      ))}
    </div>
  );
}
