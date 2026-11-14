import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NavIcon } from './NavIcon';

interface HeaderProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
  /** id del Sidebar que controla el botón de menú (móvil). */
  sidebarId: string;
}

/** Barra superior: menú (móvil), marca y selector de idioma. */
export function Header({ menuOpen, onToggleMenu, sidebarId }: HeaderProps) {
  const { t } = useTranslation();
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
        aria-label={t('header.home')}
        className="flex min-w-0 flex-col rounded-sm leading-tight no-underline"
      >
        <span className="truncate font-display text-step-1 font-bold text-fg">
          {t('app.shortTitle')}
        </span>
        <span className="truncate font-mono text-step--1 tracking-[0.08em] text-fg-muted uppercase sm:tracking-[0.16em]">
          {t('app.location')}
        </span>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
