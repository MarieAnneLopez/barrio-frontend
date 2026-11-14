import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LoadingRunnerBar } from '../components/avatar/LoadingRunnerBar';
import { WelcomeChoreography } from '../components/avatar/WelcomeChoreography';
import { ChatWidget } from '../components/chat/ChatWidget';
import { AccessibilityRail } from '../components/layout/AccessibilityRail';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { SkipLink } from '../components/layout/SkipLink';
import { WhatsAppFloat } from '../components/layout/WhatsAppFloat';
import { useFocusTrap } from '../components/ui/useFocusTrap';
import { restoreSession } from '../features/auth/authApi';
import { LoginModal } from '../features/auth/LoginModal';
import { useApplyA11y } from '../hooks/useApplyA11y';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { usePersistentFlag } from '../hooks/usePersistentFlag';

const SIDEBAR_ID = 'menu-principal';
const MAIN_ID = 'contenido';

/**
 * Estructura común: enlace de salto, Header, Sidebar (fijo en escritorio,
 * cajón con trampa de foco en móvil), contenido, Footer, barra de
 * accesibilidad, chat flotante y botón de WhatsApp.
 */
export function AppShell() {
  useApplyA11y();
  useEffect(() => {
    const controller = new AbortController();
    void restoreSession(controller.signal);
    return () => controller.abort();
  }, []);
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
  const asideClasses = isDesktop
    ? `sticky top-16 h-[calc(100dvh-4rem)] shrink-0 ${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}`
    : `fixed top-16 bottom-0 left-0 z-40 w-[280px] max-w-[85vw] transition-[transform,visibility] duration-[var(--dur-3)] ease-out ${
        drawerOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
      }`;

  return (
    <div className="min-h-dvh">
      <SkipLink target={MAIN_ID} />
      <LoadingRunnerBar />
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
        <aside ref={drawer} className={`border-r border-line bg-surface ${asideClasses}`}>
          <Sidebar
            id={SIDEBAR_ID}
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => setCollapsed((value) => !value)}
            onExpand={() => setCollapsed(false)}
          />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <main id={MAIN_ID} tabIndex={-1} className="flex-1 px-4 py-8 md:pr-24 md:pl-10">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
      <AccessibilityRail />
      <ChatWidget />
      <WhatsAppFloat />
      <WelcomeChoreography />
      <LoginModal />
    </div>
  );
}
