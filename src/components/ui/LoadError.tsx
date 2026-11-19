import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { StateIcon } from './StateIcon';

/**
 * No se pudieron cargar los datos de una página o de una lista: caja con la línea de error, el
 * ícono y el texto del estado (D100, PAL-06) y el botón para reintentar.
 */
export function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-sm border border-error bg-surface p-6">
      <p className="m-0 text-fg">
        <StateIcon kind="error" />
        {t('modules.error')}
      </p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        {t('modules.retry')}
      </Button>
    </div>
  );
}
