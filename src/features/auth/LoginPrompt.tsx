import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';

/** Texto de por qué hace falta sesión + botón que abre el LoginModal sin salir de la página. */
export function LoginPrompt({ message }: { message: string }) {
  const { t } = useTranslation();
  const openDialog = useAuthStore((s) => s.openDialog);
  return (
    <>
      {message}{' '}
      <button type="button" onClick={openDialog}
        className="ui-pressable rounded-sm text-accent underline underline-offset-4">
        {t('auth.login')}
      </button>
    </>
  );
}
