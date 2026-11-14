import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AccountButton } from '../../features/auth/AccountButton';
import { useWelcomeStore } from '../../store/welcomeStore';
import { Tooltip } from '../ui/Tooltip';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NavIcon } from './NavIcon';

interface HeaderProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
  /** id del Sidebar que controla el botón de menú (móvil). */
  sidebarId: string;
}

/** Barra superior: menú (móvil), marca, sesión y selector de idioma. */
export function Header({ menuOpen, onToggleMenu, sidebarId }: HeaderProps) {
  const { t } = useTranslation();
  const replay = useWelcomeStore((s) => s.replay);
  return (
    <header className="glass sticky top-0 z-40 flex h-16 items-center gap-3 border-x-0 border-t-0 px-4 md:px-6">
      <button
        type="button"
        onClick={onToggleMenu}
        aria-expanded={menuOpen}
        aria-controls={sidebarId}
        aria-label={menuOpen ? t('header.closeMenu') : t('header.openMenu')}
        className="ui-pressable ui-btn--ghost inline-flex size-11 items-center justify-center rounded-md border border-transparent text-fg md:hidden"
      >
        <NavIcon name="menu" />
      </button>
      <Link
        to="/"
        className="flex min-w-0 flex-col rounded-sm leading-tight no-underline"
      >
        <span className="truncate font-display text-step-1 font-bold text-fg">
          {t('app.shortTitle')}
        </span>
        <span className="truncate font-mono text-step--1 tracking-[0.08em] text-fg-muted uppercase sm:tracking-[0.16em]">
          {t('app.location')}
        </span>
        {/* El nombre accesible empieza por el texto visible (WCAG 2.5.3). */}
        <span className="sr-only">{t('header.home')}</span>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <Tooltip content={t('welcome.replay')} side="bottom">
          <button
            type="button"
            onClick={replay}
            aria-label={t('welcome.replay')}
            className="ui-pressable ui-btn--ghost inline-flex size-11 items-center justify-center rounded-md border border-transparent text-fg-secondary"
          >
            <NavIcon name="replay" />
          </button>
        </Tooltip>
        <AccountButton />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
