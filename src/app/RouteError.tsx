import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router-dom';

const BUTTON =
  'ui-pressable ui-btn--primary inline-flex min-h-11 items-center rounded-md border border-interactive bg-interactive px-4 font-medium text-on-interactive no-underline';

/**
 * errorElement de todas las rutas (H31, D67): sea cual sea la causa, el visitante
 * ve un mensaje amable y un botón para recargar, nunca «Unexpected Application Error!».
 * `inShell` = el error ocurrió dentro de una página y el menú sigue visible.
 */
export function RouteError({ inShell = false }: { inShell?: boolean }) {
  const { t } = useTranslation();
  const error = useRouteError();
  useEffect(() => {
    // Queda en la consola para diagnosticar; el visitante solo ve el mensaje.
    console.error('[RouteError]', error);
  }, [error]);

  return (
    <div role="alert" className={inShell ? 'flex max-w-2xl flex-col items-start gap-4' : 'flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface p-6 text-center'}>
      <h1 className="m-0 text-step-2 text-fg">{t('routeError.title')}</h1>
      <p className="m-0 max-w-prose text-step-0 text-fg-secondary">{t('routeError.description')}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className={BUTTON} onClick={() => window.location.reload()}>
          {t('routeError.reload')}
        </button>
        <a href="/" className="inline-flex min-h-11 items-center text-accent underline underline-offset-4">
          {t('notFound.back')}
        </a>
      </div>
    </div>
  );
}
