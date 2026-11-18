import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useAuthStore } from '../../store/authStore';

// Los formularios (con zod) bajan al abrir el diálogo: no pesan en la primera carga.
const AuthForms = lazy(() => import('./AuthForms').then((m) => ({ default: m.AuthForms })));

/** Diálogo de inicio de sesión que se abre desde el header o desde una acción que lo pide. */
export function LoginModal() {
  const { t } = useTranslation();
  const open = useAuthStore((s) => s.dialogOpen);
  const close = useAuthStore((s) => s.closeDialog);
  return (
    <Modal open={open} onClose={close} title={t('auth.title')} description={t('auth.description')}>
      {open ? (
        <Suspense fallback={<Spinner />}>
          <AuthForms onDone={close} />
        </Suspense>
      ) : null}
    </Modal>
  );
}
