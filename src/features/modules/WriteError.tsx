import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApiError } from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { LoginPrompt } from '../auth/LoginPrompt';

/**
 * Error de una escritura. 401: la sesión venció; se cierra y se abre el diálogo
 * para iniciarla de nuevo. 403: la cuenta no es de administración. Lo demás:
 * el mensaje de la API.
 */
export function WriteError({ error }: { error: ApiError | null }) {
  const { t } = useTranslation();
  const expired = error?.status === 401;
  useEffect(() => {
    if (expired) useAuthStore.getState().expire();
  }, [expired]);
  if (!error) return null;
  return (
    <p role="alert" className="m-0 rounded-md border border-error p-3 text-step--1 text-fg">
      {expired ? (
        <LoginPrompt message={t('forms.needAdmin')} />
      ) : (
        t(`forms.errors.${error.code}`, { defaultValue: error.message })
      )}
    </p>
  );
}
