import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApiError } from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { useAvatarStore } from '../../store/avatarStore';
import { LoginPrompt } from '../auth/LoginPrompt';

/**
 * Error de una escritura. 401: la sesión venció; se cierra y se abre el diálogo
 * para iniciarla de nuevo. 403: la cuenta no es de administración. Lo demás:
 * el mensaje de la API. Ante un error que no es de sesión, Mini Marie se pone triste.
 */
export function WriteError({ error }: { error: ApiError | null }) {
  const { t } = useTranslation();
  const expired = error?.status === 401;
  useEffect(() => {
    if (expired) useAuthStore.getState().expire();
    else if (error) useAvatarStore.getState().dispatch({ type: 'ERROR' });
  }, [expired, error]);
  if (!error) return null;
  return (
    <p role="alert" className="m-0 rounded-sm border-2 border-error bg-surface p-3 text-step--1 text-fg">
      {expired ? (
        <LoginPrompt message={t('forms.needAdmin')} />
      ) : (
        t(`forms.errors.${error.code}`, { defaultValue: error.message })
      )}
    </p>
  );
}
