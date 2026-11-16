import { useTranslation } from 'react-i18next';
import { AccountButton } from '../../features/auth/AccountButton';
import { useWelcomeStore } from '../../store/welcomeStore';
import { Tooltip } from '../ui/Tooltip';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NavIcon } from './NavIcon';

/**
 * Repetir bienvenida, cuenta e idioma. Van en la barra desde 640 px; por debajo pasan al panel
 * del menú, para que el nombre del sitio no se corte.
 */
export function HeaderTools() {
  const { t } = useTranslation();
  const replay = useWelcomeStore((s) => s.replay);
  return (
    <>
      <Tooltip content={t('welcome.replay')} side="bottom">
        <button
          type="button"
          onClick={replay}
          aria-label={t('welcome.replay')}
          className="ui-pressable ui-btn--ghost inline-flex size-11 items-center justify-center rounded-sm border border-transparent text-fg-secondary"
        >
          <NavIcon name="replay" />
        </button>
      </Tooltip>
      <AccountButton />
      <LanguageSwitcher />
    </>
  );
}
