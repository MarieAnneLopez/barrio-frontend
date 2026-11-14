import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { NavIcon } from '../../components/layout/NavIcon';
import { useAuthStore } from '../../store/authStore';

const CLASSES =
  'ui-pressable ui-btn--ghost inline-flex min-h-11 items-center gap-2 rounded-md border border-transparent px-3 text-step--1 text-fg-secondary';

/** Header: «Iniciar sesión» abre el diálogo; con sesión, nombre y rol enlazan a /acceso. */
export function AccountButton() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const openDialog = useAuthStore((s) => s.openDialog);

  if (!user) {
    return (
      <button type="button" onClick={openDialog} className={CLASSES}>
        <NavIcon name="login" />
        <span className="sr-only sm:not-sr-only">{t('auth.login')}</span>
      </button>
    );
  }
  return (
    <Link to="/acceso" className={`${CLASSES} no-underline`}>
      <NavIcon name="login" />
      <span className="sr-only sm:not-sr-only sm:max-w-[12rem] sm:truncate">{user.nombre}</span>
      <span className="sr-only">, {t(`auth.roles.${user.rol}`)}</span>
    </Link>
  );
}
