import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { ApiError } from '../../lib/apiClient';

/** Error de una escritura: sin sesión ofrece iniciarla; si no, el mensaje de la API. */
export function WriteError({ error }: { error: ApiError | null }) {
  const { t } = useTranslation();
  if (!error) return null;
  return (
    <p role="alert" className="m-0 rounded-md border border-error p-3 text-step--1 text-fg">
      {error.status === 401 ? (
        <>
          {t('forms.needAdmin')}{' '}
          <Link to="/acceso" className="text-accent underline underline-offset-4">
            {t('ratings.login')}
          </Link>
        </>
      ) : (
        t(`forms.errors.${error.code}`, { defaultValue: error.message })
      )}
    </p>
  );
}
