import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { useFocusTrap } from '../components/ui/useFocusTrap';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { usePersistentFlag } from '../hooks/usePersistentFlag';

const SIDEBAR_ID = 'menu-principal';

/**
 * Estructura común: enlace de salto, Header, Sidebar (fijo en escritorio,
 * cajón con trampa de foco en móvil) y el contenido de la ruta.
 */
export function AppShell() {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [collapsed, setCollapsed] = usePersistentFlag('sidebar-collapsed', false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawer = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // Navegar o cambiar de ancho cierra el cajón (ajuste durante el render).
  const drawerKey = `${pathname}|${isDesktop}`;
  const [lastDrawerKey, setLastDrawerKey] = useState(drawerKey);
  if (drawerKey !== lastDrawerKey) {
    setLastDrawerKey(drawerKey);
    setDrawerOpen(false);
  }
  useFocusTrap(drawer, !isDesktop && drawerOpen, () => setDrawerOpen(false));

  const sidebarCollapsed = isDesktop && collapsed;
  const drawerClasses = drawerOpen
    ? 'visible translate-x-0'
    : 'invisible -translate-x-full';

  return (
    <div className="min-h-dvh">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:rounded-md focus:bg-interactive focus:px-4 focus:py-2 focus:text-on-interactive"
      >
        {t('a11y.skipToContent')}
      </a>
      <Header
        menuOpen={drawerOpen}
        onToggleMenu={() => setDrawerOpen((open) => !open)}
        sidebarId={SIDEBAR_ID}
      />
      <div className="flex">
        {!isDesktop && drawerOpen ? (
          <div
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 top-16 z-30 bg-[var(--overlay)]"
          />
        ) : null}
        <aside
          ref={drawer}
          className={
            isDesktop
              ? `sticky top-16 h-[calc(100dvh-4rem)] shrink-0 border-r border-line bg-surface ${
                  sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
                }`
              : `fixed top-16 bottom-0 left-0 z-40 w-[280px] max-w-[85vw] border-r border-line bg-surface transition-[transform,visibility] duration-[var(--dur-3)] ease-out ${drawerClasses}`
          }
        >
          <Sidebar
            id={SIDEBAR_ID}
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => setCollapsed((value) => !value)}
            onExpand={() => setCollapsed(false)}
          />
        </aside>
        <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 px-4 py-8 md:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
