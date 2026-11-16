import { useTranslation } from 'react-i18next';
import type { ApiError } from '../../lib/apiClient';

/** Error de login o registro, traducido por código (INVALID_CREDENTIALS, EMAIL_TAKEN…). */
export function AuthError({ error }: { error: ApiError | null }) {
  const { t } = useTranslation();
  if (!error) return null;
  return (
    <p role="alert" className="m-0 rounded-sm border border-error bg-surface p-3 text-step--1 text-fg">
      {t(`auth.errors.${error.code}`, { defaultValue: error.message })}
    </p>
  );
}
