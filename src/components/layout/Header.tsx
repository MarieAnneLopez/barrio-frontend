import './site-header.css';
import { startTransition, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { BrandLogo } from './BrandLogo';
import { HeaderTools } from './HeaderTools';
import { NavIcon } from './NavIcon';
import { SiteMenu } from './SiteMenu';
import { useHeaderLook } from './useHeaderLook';

const MENU_ID = 'menu-principal';

/**
 * Barra superior fija (etapa 2): logo y nombre, herramientas y el botón «Menú», que abre el panel
 * con todas las rutas (reemplaza a la barra lateral). Toma el tono de la sección que tiene debajo.
 */
export function Header() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const wide = useMediaQuery('(min-width: 640px)');
  const { tone, float } = useHeaderLook();
  const [open, setOpen] = useState(false);

  // Navegar cierra el menú (ajuste durante el render, sin efecto).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <header
      data-tone={tone}
      data-float={float || undefined}
      data-open={open || undefined}
      className={`site-header fixed inset-x-0 top-0 z-40 ${tone === 'papel' ? 'tone-papel' : 'tone-noche'}`}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4 md:px-10">
        <BrandLogo />
        <Link to="/" className="flex min-w-0 flex-col rounded-sm leading-tight no-underline">
          <span className="font-display text-step-1 whitespace-nowrap text-fg">{t('app.shortTitle')}</span>
          <span className="ui-eyebrow truncate text-fg-muted max-sm:hidden">{t('app.location')}</span>
          {/* El nombre accesible empieza por el texto visible (WCAG 2.5.3). */}
          <span className="sr-only">{t('header.home')}</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {wide ? <HeaderTools /> : null}
          <button
            type="button"
            // INP (D115): el clic pinta enseguida (el botón hundido) y el panel se monta en una transición;
            // montarlo dentro del clic costaba ~120 ms de código con la CPU de un celular de gama media.
            onClick={() => startTransition(() => setOpen((value) => !value))}
            aria-expanded={open}
            aria-controls={MENU_ID}
            aria-label={open ? t('header.closeMenu') : t('header.openMenu')}
            className="ui-pressable ui-btn--ghost inline-flex min-h-11 items-center gap-2 rounded-sm border border-line-strong px-3 text-step--1 font-medium tracking-[0.12em] text-fg uppercase"
          >
            <NavIcon name={open ? 'close' : 'menu'} />
            <span aria-hidden="true">{t('header.menu')}</span>
          </button>
        </div>
      </div>
      {open ? <SiteMenu id={MENU_ID} onClose={() => setOpen(false)} tools={wide ? null : <HeaderTools />} /> : null}
    </header>
  );
}
