import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/ui/Modal';
import { useAuthStore } from '../../store/authStore';
import { AuthForms } from './AuthForms';

/** Diálogo de inicio de sesión que se abre desde el header o desde una acción que lo pide. */
export function LoginModal() {
  const { t } = useTranslation();
  const open = useAuthStore((s) => s.dialogOpen);
  const close = useAuthStore((s) => s.closeDialog);
  return (
    <Modal open={open} onClose={close} title={t('auth.title')} description={t('auth.description')}>
      <AuthForms onDone={close} />
    </Modal>
  );
}
