import { lazy, type ReactNode } from 'react';
import type { Params, RouteObject } from 'react-router-dom';
import { HistoryPage } from '../features/history/HistoryPage';
import { HomePage } from '../features/pages/HomePage';
import { findCategory } from '../lib/categoryConfig';
import { SECTION_PAGES } from '../lib/navigation';
import { AppShell } from './AppShell';
import { RouteError } from './RouteError';

/* eslint-disable react-refresh/only-export-components -- archivo de configuración de rutas, no de componentes */
// Code-splitting por ruta (H27): Inicio e Historia van en el chunk inicial (Historia en
// diferido empeoraba su LCP de 3,1 a 3,7 s por la cascada de descargas); cada página
// se descarga al visitarla (AppShell la envuelve en Suspense con la barra de carga).
const AccessPage = lazy(() => import('../features/auth/AccessPage').then((m) => ({ default: m.AccessPage })));
const ModulePage = lazy(() => import('../features/modules/ModulePage').then((m) => ({ default: m.ModulePage })));
const CreatorPage = lazy(() => import('../features/pages/CreatorPage').then((m) => ({ default: m.CreatorPage })));
const GalleryPage = lazy(() => import('../features/gallery/GalleryPage').then((m) => ({ default: m.GalleryPage })));
const PhotoCreditsPage = lazy(() =>
  import('../features/gallery/PhotoCreditsPage').then((m) => ({ default: m.PhotoCreditsPage })),
);
const HelpPage = lazy(() => import('../features/pages/HelpPage').then((m) => ({ default: m.HelpPage })));
const MapPage = lazy(() => import('../features/map/MapPage').then((m) => ({ default: m.MapPage })));
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
  map: <MapPage />,
  gallery: <GalleryPage />,
};

/** Árbol de rutas: compartido por la app (BrowserRouter) y las pruebas (MemoryRouter). */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      {
        // Ruta sin path: un error en cualquier página se muestra dentro del shell (H31).
        errorElement: <RouteError inShell />,
        children: [
          // El Inicio ocupa todo el ancho y empieza bajo el header (AppShell lee `handle.bleed`).
          { index: true, element: <HomePage />, handle: { bleed: true } },
          ...SECTION_PAGES.map((item) => ({
            path: item.path.slice(1),
            element: DEDICATED[item.key] ?? <SectionPage section={item.key} />,
            // Mapa 3D es el escenario del mapa a pantalla completa (features/map/stage).
            ...(item.key === 'map' ? { handle: { bleed: true } } : {}),
          })),
          // Cada módulo es su escenario del mapa; un slug que no existe da 404 en la columna normal.
          { path: 'categorias/:slug', element: <ModulePage />, handle: { bleed: (params: Params) => Boolean(findCategory(params.slug)) } },
          { path: 'creditos-fotos', element: <PhotoCreditsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
