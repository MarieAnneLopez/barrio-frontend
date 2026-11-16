import { useId, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORIES, categoryPath } from '../../lib/categoryConfig';
import { NAV_AFTER_CATEGORIES, NAV_BEFORE_CATEGORIES, type NavItem } from '../../lib/navigation';
import { useFocusTrap } from '../ui/useFocusTrap';
import { MenuLink } from './MenuLink';

interface SiteMenuProps {
  id: string;
  onClose: () => void;
  /** Idioma, cuenta y repetir bienvenida cuando no caben en la barra (menos de 640 px). */
  tools: ReactNode;
}

const LIST = 'm-0 flex list-none flex-col gap-1 p-0';

/**
 * Panel del menú (etapa 2): reemplaza a la barra lateral. Tres bloques en el orden de
 * lib/navigation.ts: secciones, las 14 categorías y el resto. El foco queda atrapado dentro y
 * Escape lo cierra (useFocusTrap); el velo de fuera también. Toma el tono del header.
 */
export function SiteMenu({ id, onClose, tools }: SiteMenuProps) {
  const { t } = useTranslation();
  const panel = useRef<HTMLElement>(null);
  const categoriesId = useId();
  useFocusTrap(panel, true, onClose);
  const section = (item: NavItem) => (
    <li key={item.key}>
      <MenuLink to={item.path} end={item.path === '/'} display>
        {t(`nav.${item.key}`)}
      </MenuLink>
    </li>
  );

  return (
    <>
      <div aria-hidden="true" data-testid="menu-veil" onClick={onClose} className="site-menu__veil" />
      <nav ref={panel} id={id} tabIndex={-1} aria-label={t('sidebar.label')} className="site-menu">
        <div className="mx-auto grid max-w-[1200px] gap-x-10 gap-y-6 px-4 py-8 md:grid-cols-[1fr_2fr_1fr] md:px-10">
          <ul className={LIST}>{NAV_BEFORE_CATEGORIES.map(section)}</ul>
          <div className="flex flex-col gap-3">
            <p id={categoriesId} className="ui-eyebrow m-0 px-2 text-fg-muted">
              {t('sidebar.categories')}
            </p>
            <ul aria-labelledby={categoriesId} className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-1 p-0 sm:grid-cols-2">
              {CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <MenuLink to={categoryPath(category.slug)} icon={category.emoji}>
                    {t(`categories.${category.slug}.name`)}
                  </MenuLink>
                </li>
              ))}
            </ul>
          </div>
          <ul className={LIST}>{NAV_AFTER_CATEGORIES.map(section)}</ul>
        </div>
        {tools ? (
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-2 border-t border-line px-4 py-4">{tools}</div>
        ) : null}
      </nav>
    </>
  );
}
