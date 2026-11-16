import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import type { ApiError } from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { PageHeader } from '../pages/PageHeader';
import { logout, toApiError } from './authApi';
import { AuthError } from './AuthError';
import { AuthForms } from './AuthForms';

/** /acceso: formularios sin sesión; con sesión, la cuenta, lo que permite su rol y cerrar sesión. */
export function AccessPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);

  const leave = async () => {
    setBusy(true);
    setFailure(null);
    try {
      await logout();
    } catch (error) {
      setFailure(toApiError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <PageHeader title={t('nav.access')} description={t('pages.access')} />
      {user ? (
        <section aria-labelledby="cuenta" className="ui-card flex flex-col gap-4 p-6">
          <h2 id="cuenta" className="m-0 text-step-1 text-fg">{t('auth.account')}</h2>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-fg-secondary">
            <dt className="text-fg-muted">{t('auth.name')}</dt>
            <dd className="m-0 text-fg">{user.nombre}</dd>
            <dt className="text-fg-muted">{t('auth.email')}</dt>
            <dd className="m-0 break-all text-fg">{user.email}</dd>
            <dt className="text-fg-muted">{t('auth.role')}</dt>
            <dd className="m-0 text-fg">{t(`auth.roles.${user.rol}`)}</dd>
          </dl>
          <p className="m-0 text-step--1 text-fg-secondary">{t(`auth.permissions.${user.rol}`)}</p>
          <AuthError error={failure} />
          <Button variant="secondary" onClick={leave} loading={busy} className="self-start">
            {t('auth.logout')}
          </Button>
        </section>
      ) : (
        <section aria-label={t('auth.title')} className="ui-card p-6">
          <AuthForms onDone={() => undefined} />
        </section>
      )}
    </div>
  );
}
