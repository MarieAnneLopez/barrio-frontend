import { useTranslation } from 'react-i18next';
import { NAV_AFTER_CATEGORIES, NAV_BEFORE_CATEGORIES, type NavItem } from '../../lib/navigation';
import { CategoryMenu } from './CategoryMenu';
import { NavIcon } from './NavIcon';
import { SidebarLink } from './SidebarLink';

interface SidebarProps {
  id: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onExpand: () => void;
}

/**
 * Menú lateral (§11.2.1): 260 px expandido / 72 px contraído en escritorio.
 * En móvil lo presenta AppShell como cajón; aquí solo va el contenido.
 */
export function Sidebar({ id, collapsed, onToggleCollapsed, onExpand }: SidebarProps) {
  const { t } = useTranslation();
  const renderItem = (item: NavItem) => (
    <SidebarLink
      key={item.key}
      to={item.path}
      label={t(`nav.${item.key}`)}
      icon={<NavIcon name={item.icon} />}
      collapsed={collapsed}
      end={item.path === '/'}
    />
  );

  return (
    <nav
      id={id}
      aria-label={t('sidebar.label')}
      data-collapsed={collapsed}
      className="flex h-full flex-col gap-2 overflow-y-auto p-3"
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        aria-controls={id}
        aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        className={`ui-pressable ui-btn--ghost hidden size-11 items-center justify-center self-end rounded-md border border-transparent text-fg-secondary md:inline-flex ${
          collapsed ? 'self-center' : ''
        }`}
      >
        <NavIcon name="collapse" className={collapsed ? 'rotate-180' : ''} />
      </button>
      <ul className="m-0 flex flex-col gap-1 p-0">
        {NAV_BEFORE_CATEGORIES.map(renderItem)}
        <CategoryMenu collapsed={collapsed} onRequestExpand={onExpand} />
        {NAV_AFTER_CATEGORIES.map(renderItem)}
      </ul>
    </nav>
  );
}
