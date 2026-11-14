import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { CATEGORIES, categoryPath } from '../../lib/categoryConfig';
import { Tooltip } from '../ui/Tooltip';
import { NavIcon } from './NavIcon';
import { SidebarLink } from './SidebarLink';

interface CategoryMenuProps {
  collapsed: boolean;
  /** Contraído, abrir el submenú expande el Sidebar para mostrar los nombres. */
  onRequestExpand: () => void;
}

/** Submenú "Categorías" con los 14 módulos (§11.2.1), botón de disclosure. */
export function CategoryMenu({ collapsed, onRequestExpand }: CategoryMenuProps) {
  const { t } = useTranslation();
  const listId = useId();
  const { pathname } = useLocation();
  const inCategory = pathname.startsWith('/categorias/');
  const [open, setOpen] = useState(inCategory);

  // Al entrar a un módulo, el submenú se abre (ajuste durante el render,
  // sin efecto: https://react.dev/learn/you-might-not-need-an-effect).
  const [wasInCategory, setWasInCategory] = useState(inCategory);
  if (inCategory !== wasInCategory) {
    setWasInCategory(inCategory);
    if (inCategory) setOpen(true);
  }

  const toggle = () => {
    if (collapsed) {
      onRequestExpand();
      setOpen(true);
      return;
    }
    setOpen((value) => !value);
  };

  const expanded = open && !collapsed;
  const label = t('sidebar.categories');
  const button = (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={listId}
      onClick={toggle}
      className={`ui-pressable ui-btn--ghost flex min-h-11 w-full items-center gap-3 rounded-md border border-transparent px-3 text-left text-step--1 ${
        inCategory ? 'text-fg' : 'text-fg-secondary'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <NavIcon name="grid" />
      <span className={collapsed ? 'sr-only' : 'flex-1 truncate'}>{label}</span>
      {collapsed ? null : (
        <NavIcon
          name="chevron"
          size={16}
          className={`text-accent transition-transform duration-[var(--dur-2)] ease-out ${expanded ? 'rotate-180' : ''}`}
        />
      )}
    </button>
  );

  return (
    <li className="list-none">
      {collapsed ? (
        <Tooltip content={label} side="right" delay={200}>
          {button}
        </Tooltip>
      ) : (
        button
      )}
      <ul
        id={listId}
        hidden={!expanded}
        aria-label={t('sidebar.categoriesHint')}
        className="mt-1 flex flex-col gap-1 border-l border-line pl-2 ml-5"
      >
        {CATEGORIES.map((category) => (
          <SidebarLink
            key={category.slug}
            to={categoryPath(category.slug)}
            label={t(`categories.${category.slug}.name`)}
            icon={category.emoji}
            collapsed={false}
          />
        ))}
      </ul>
    </li>
  );
}
