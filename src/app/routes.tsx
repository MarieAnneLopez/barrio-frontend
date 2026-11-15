import { lazy, type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { HistoryPage } from '../features/history/HistoryPage';
import { HomePage } from '../features/pages/HomePage';
import { SECTION_PAGES } from '../lib/navigation';
import { AppShell } from './AppShell';

/* eslint-disable react-refresh/only-export-components -- archivo de configuración de rutas, no de componentes */
// Code-splitting por ruta (H27): Inicio e Historia van en el chunk inicial (Historia en
// diferido empeoraba su LCP de 3,1 a 3,7 s por la cascada de descargas); cada página
// se descarga al visitarla (AppShell la envuelve en Suspense con la barra de carga).
const AccessPage = lazy(() => import('../features/auth/AccessPage').then((m) => ({ default: m.AccessPage })));
const ModulePage = lazy(() => import('../features/modules/ModulePage').then((m) => ({ default: m.ModulePage })));
const CreatorPage = lazy(() => import('../features/pages/CreatorPage').then((m) => ({ default: m.CreatorPage })));
const HelpPage = lazy(() => import('../features/pages/HelpPage').then((m) => ({ default: m.HelpPage })));
const FaqPage = lazy(() => import('../features/pages/FaqPage').then((m) => ({ default: m.FaqPage })));
const NotFoundPage = lazy(() => import('../features/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const RankingsPage = lazy(() => import('../features/ranking/RankingsPage').then((m) => ({ default: m.RankingsPage })));
const SectionPage = lazy(() => import('../features/pages/SectionPage').then((m) => ({ default: m.SectionPage })));

/** Secciones con página propia; el resto usa SectionPage hasta su hito. */
const DEDICATED: Record<string, ReactNode> = {
  faq: <FaqPage />,
  creator: <CreatorPage />,
  ranking: <RankingsPage />,
  history: <HistoryPage />,
  access: <AccessPage />,
  help: <HelpPage />,
};

/** Árbol de rutas: compartido por la app (BrowserRouter) y las pruebas (MemoryRouter). */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      ...SECTION_PAGES.map((item) => ({
        path: item.path.slice(1),
        element: DEDICATED[item.key] ?? <SectionPage section={item.key} />,
      })),
      { path: 'categorias/:slug', element: <ModulePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
