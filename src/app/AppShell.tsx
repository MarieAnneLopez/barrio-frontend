import { Suspense, useEffect } from 'react';
import { Outlet, useMatches } from 'react-router-dom';
import { LoadingScreen } from '../components/avatar/LoadingScreen';
import { WelcomeGate } from '../components/avatar/WelcomeGate';
import { ChatWidget } from '../components/chat/ChatWidget';
import { AccessibilityRail } from '../components/layout/AccessibilityRail';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { SkipLink } from '../components/layout/SkipLink';
import { WhatsAppFloat } from '../components/layout/WhatsAppFloat';
import { restoreSession } from '../features/auth/authApi';
import { LoginModal } from '../features/auth/LoginModal';
import { ScenePortal } from '../features/home/ScenePortal';
import { useApplyA11y } from '../hooks/useApplyA11y';
import { RouteFallback } from './RouteFallback';

const MAIN_ID = 'contenido';
/** Columna de contenido: centrada, a 1200 px como máximo; deja libre la barra de accesibilidad. */
const COLUMN = 'mx-auto w-full max-w-[1200px] px-4 pt-24 pb-8 md:pr-20 md:pl-10 xl:px-10';

/**
 * Estructura común (etapa 2): enlace de salto, header fijo con el menú desplegable, contenido,
 * pie, barra de accesibilidad, chat flotante y botón de WhatsApp. Ya no hay barra lateral.
 * Una ruta con `handle: { bleed: true }` ocupa todo el ancho y empieza bajo el header (Inicio, Galería).
 */
export function AppShell() {
  useApplyA11y();
  useEffect(() => {
    const controller = new AbortController();
    void restoreSession(controller.signal);
    return () => controller.abort();
  }, []);
  const bleed = useMatches().some((match) => (match.handle as { bleed?: boolean } | undefined)?.bleed === true);

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink target={MAIN_ID} />
      <LoadingScreen />
      <Header />
      <main id={MAIN_ID} tabIndex={-1} className={`flex-1 ${bleed ? '' : COLUMN}`}>
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <AccessibilityRail />
      <ChatWidget />
      <WhatsAppFloat />
      <WelcomeGate />
      <ScenePortal />
      <LoginModal />
    </div>
  );
}
